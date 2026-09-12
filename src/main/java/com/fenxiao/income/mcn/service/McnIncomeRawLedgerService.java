package com.fenxiao.income.mcn.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fenxiao.income.mcn.domain.McnIncomeResolutionStatus;
import com.fenxiao.income.mcn.dto.McnIncomeDeliveryRequest;
import com.fenxiao.income.mcn.dto.McnIncomeDeliveryResponse;
import com.fenxiao.income.mcn.dto.McnIncomeFactRequest;
import com.fenxiao.income.mcn.entity.McnIncomeDeliveryReceipt;
import com.fenxiao.income.mcn.entity.McnIncomeRawLedgerEvent;
import com.fenxiao.income.mcn.repository.McnIncomeDeliveryReceiptRepository;
import com.fenxiao.income.mcn.repository.McnIncomeRawLedgerEventRepository;
import com.fenxiao.platform.domain.PlatformBindingStatus;
import com.fenxiao.platform.repository.PlatformAccountBindingRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Locale;

/**
 * Records source evidence only. This service intentionally has no dependency on the reward engine,
 * wallet, lifecycle or withdrawal services.
 */
@Service
@Transactional
public class McnIncomeRawLedgerService {

    private static final String MCN = "MCN";

    private final McnIncomeDeliveryReceiptRepository receiptRepository;
    private final McnIncomeRawLedgerEventRepository eventRepository;
    private final PlatformAccountBindingRepository bindingRepository;
    private final ObjectMapper objectMapper;
    private final Clock clock;

    public McnIncomeRawLedgerService(McnIncomeDeliveryReceiptRepository receiptRepository,
                                     McnIncomeRawLedgerEventRepository eventRepository,
                                     PlatformAccountBindingRepository bindingRepository,
                                     ObjectMapper objectMapper,
                                     Clock clock) {
        this.receiptRepository = receiptRepository;
        this.eventRepository = eventRepository;
        this.bindingRepository = bindingRepository;
        this.objectMapper = objectMapper;
        this.clock = clock;
    }

    public McnIncomeDeliveryResponse accept(McnIncomeDeliveryRequest request) {
        String sourceSystem = normalizeSourceSystem(request.sourceSystem());
        String deliveryId = require(request.deliveryId(), "delivery id");
        String platformCode = normalizePlatform(request.platformCode());
        String deliveryHash = sha256(json(request));

        var existingReceipt = receiptRepository.findBySourceSystemAndDeliveryId(sourceSystem, deliveryId);
        if (existingReceipt.isPresent()) {
            if (!existingReceipt.get().getPayloadHash().equals(deliveryHash)) {
                throw new IllegalStateException("delivery id conflicts with stored raw ledger evidence");
            }
            return new McnIncomeDeliveryResponse(deliveryId, "DUPLICATE_DELIVERY",
                    existingReceipt.get().getFactCount(), 0, existingReceipt.get().getFactCount(), 0);
        }

        int newFacts = 0;
        int duplicateFacts = 0;
        int unmatchedFacts = 0;
        LocalDateTime receivedAt = LocalDateTime.now(clock).withNano(0);
        for (McnIncomeFactRequest fact : request.facts()) {
            String eventId = require(fact.sourceEventId(), "source event id");
            String revision = require(fact.sourceRevision(), "source revision");
            String factPayload = json(fact.sourcePayload());
            // The source payload is retained verbatim, while the complete normalized fact is fingerprinted.
            // This prevents a changed amount, status or timestamp from being silently treated as a duplicate.
            String factHash = sha256(json(fact));
            var existingFact = eventRepository.findBySourceSystemAndPlatformCodeAndSourceEventIdAndSourceRevision(
                    sourceSystem, platformCode, eventId, revision);
            if (existingFact.isPresent()) {
                if (!existingFact.get().getPayloadHash().equals(factHash)) {
                    throw new IllegalStateException("source event revision conflicts with stored raw ledger evidence");
                }
                duplicateFacts++;
                continue;
            }

            String platformUserId = require(fact.platformUserId(), "platform user id");
            var binding = bindingRepository.findByPlatformCodeAndPlatformUserId(platformCode, platformUserId)
                    .filter(value -> value.getBindingStatus() == PlatformBindingStatus.VERIFIED);
            McnIncomeResolutionStatus resolutionStatus = binding.isPresent()
                    ? McnIncomeResolutionStatus.BOUND : McnIncomeResolutionStatus.UNMATCHED;
            Long resolvedUserId = binding.map(value -> value.getUserId()).orElse(null);
            String resolutionReason = binding.isPresent()
                    ? "VERIFIED_PLATFORM_BINDING" : "NO_VERIFIED_PLATFORM_BINDING";
            if (resolutionStatus == McnIncomeResolutionStatus.UNMATCHED) {
                unmatchedFacts++;
            }
            eventRepository.save(McnIncomeRawLedgerEvent.record(
                    sourceSystem, deliveryId, platformCode, eventId, revision,
                    trimToNull(fact.originalSourceEventId()), platformUserId, resolvedUserId,
                    resolutionStatus, resolutionReason, fact.eventType(), fact.settlementStatus(), fact.amount(),
                    require(fact.currencyCode(), "currency code").toUpperCase(Locale.ROOT), fact.occurredAt(),
                    fact.settledAt(), fact.sourceUpdatedAt(), trimToNull(fact.guildId()), factHash, factPayload, receivedAt));
            newFacts++;
        }
        receiptRepository.save(McnIncomeDeliveryReceipt.accept(sourceSystem, deliveryId, deliveryHash,
                request.facts().size(), receivedAt));
        return new McnIncomeDeliveryResponse(deliveryId, "ACCEPTED", request.facts().size(), newFacts,
                duplicateFacts, unmatchedFacts);
    }

    private String normalizeSourceSystem(String value) {
        String sourceSystem = require(value, "source system").toUpperCase(Locale.ROOT);
        if (!MCN.equals(sourceSystem)) {
            throw new IllegalArgumentException("only MCN income facts are accepted by this endpoint");
        }
        return sourceSystem;
    }

    private String normalizePlatform(String value) {
        String platform = require(value, "platform code").toUpperCase(Locale.ROOT);
        if (!"TIMO".equals(platform) && !"LINKY".equals(platform)) {
            throw new IllegalArgumentException("income platform must be TIMO or LINKY");
        }
        return platform;
    }

    private String json(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalArgumentException("income source payload cannot be serialized", exception);
        }
    }

    private String sha256(String value) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(hash);
        } catch (Exception exception) {
            throw new IllegalStateException("unable to hash raw ledger evidence", exception);
        }
    }

    private String require(String value, String label) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(label + " is required");
        }
        return value.trim();
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
