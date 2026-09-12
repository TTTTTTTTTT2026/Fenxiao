package com.fenxiao.income.mcn.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fenxiao.income.mcn.domain.McnIncomeResolutionStatus;
import com.fenxiao.income.mcn.repository.McnIncomeDeliveryReceiptRepository;
import com.fenxiao.income.mcn.repository.McnIncomeRawLedgerEventRepository;
import com.fenxiao.platform.entity.PlatformAccountBinding;
import com.fenxiao.platform.repository.PlatformAccountBindingRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ActiveProfiles("test")
@AutoConfigureMockMvc
@Transactional
@SpringBootTest(properties = "app.distribution.internal-token=test-token")
class McnIncomeRawLedgerControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private PlatformAccountBindingRepository bindingRepository;
    @Autowired private McnIncomeRawLedgerEventRepository eventRepository;
    @Autowired private McnIncomeDeliveryReceiptRepository receiptRepository;

    @Test
    void shouldRecordAResolvedMcnFactWithoutCallingTheRewardFlow() throws Exception {
        PlatformAccountBinding binding = PlatformAccountBinding.submit(94001L, "LINKY", "51684621", LocalDateTime.of(2026, 9, 12, 8, 0));
        binding.verify("22000448", LocalDateTime.of(2026, 9, 12, 8, 10), "MCN_LINKY", "request-1", LocalDateTime.of(2026, 9, 12, 8, 11));
        bindingRepository.save(binding);

        mockMvc.perform(post("/internal/distribution/mcn/income-ledger-deliveries")
                        .header("X-Internal-Token", "test-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(delivery("delivery-1", "LINKY", "income-1", "1", "51684621"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deliveryStatus").value("ACCEPTED"))
                .andExpect(jsonPath("$.newFactCount").value(1))
                .andExpect(jsonPath("$.unmatchedFactCount").value(0));

        var event = eventRepository.findAll().getFirst();
        assertThat(event.getResolutionStatus()).isEqualTo(McnIncomeResolutionStatus.BOUND);
        assertThat(event.getResolvedUserId()).isEqualTo(94001L);
        assertThat(event.getSourceEventId()).isEqualTo("income-1");
        assertThat(receiptRepository.count()).isEqualTo(1);
    }

    @Test
    void shouldTreatTheSameDeliveryAsIdempotent() throws Exception {
        String body = objectMapper.writeValueAsString(delivery("delivery-2", "TIMO", "income-2", "1", "196171225988"));
        mockMvc.perform(post("/internal/distribution/mcn/income-ledger-deliveries")
                        .header("X-Internal-Token", "test-token").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deliveryStatus").value("ACCEPTED"));
        mockMvc.perform(post("/internal/distribution/mcn/income-ledger-deliveries")
                        .header("X-Internal-Token", "test-token").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deliveryStatus").value("DUPLICATE_DELIVERY"));

        assertThat(eventRepository.count()).isEqualTo(1);
        assertThat(receiptRepository.count()).isEqualTo(1);
        assertThat(eventRepository.findAll().getFirst().getResolutionStatus()).isEqualTo(McnIncomeResolutionStatus.UNMATCHED);
    }

    @Test
    void shouldRejectConflictingEvidenceForTheSameSourceRevision() throws Exception {
        mockMvc.perform(post("/internal/distribution/mcn/income-ledger-deliveries")
                        .header("X-Internal-Token", "test-token").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(delivery("delivery-3a", "LINKY", "income-3", "1", "51684621"))))
                .andExpect(status().isOk());

        Map<String, Object> conflicting = delivery("delivery-3b", "LINKY", "income-3", "1", "51684621");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> facts = (List<Map<String, Object>>) conflicting.get("facts");
        @SuppressWarnings("unchecked")
        Map<String, Object> sourcePayload = (Map<String, Object>) facts.getFirst().get("sourcePayload");
        sourcePayload.put("amount", "changed");

        mockMvc.perform(post("/internal/distribution/mcn/income-ledger-deliveries")
                        .header("X-Internal-Token", "test-token").contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(conflicting)))
                .andExpect(status().isBadRequest());
        assertThat(eventRepository.count()).isEqualTo(1);
    }

    private Map<String, Object> delivery(String deliveryId, String platformCode, String sourceEventId,
                                         String revision, String platformUserId) {
        return Map.of(
                "deliveryId", deliveryId,
                "sourceSystem", "MCN",
                "platformCode", platformCode,
                "facts", List.of(Map.of(
                        "sourceEventId", sourceEventId,
                        "sourceRevision", revision,
                        "platformUserId", platformUserId,
                        "eventType", "INCOME",
                        "settlementStatus", "SETTLED",
                        "amount", new BigDecimal("88.25"),
                        "currencyCode", "USD",
                        "occurredAt", "2026-09-12T07:30:00",
                        "settledAt", "2026-09-12T08:30:00",
                        "sourceUpdatedAt", "2026-09-12T08:31:00",
                        "guildId", "22000448",
                        "sourcePayload", new java.util.LinkedHashMap<>(Map.of("upstreamOrderId", sourceEventId))
                ))
        );
    }
}
