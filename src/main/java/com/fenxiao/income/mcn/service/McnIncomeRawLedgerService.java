package com.fenxiao.income.mcn.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fenxiao.income.mcn.domain.McnIncomeResolutionStatus;
import com.fenxiao.income.mcn.domain.McnIncomeEventType;
import com.fenxiao.income.mcn.domain.McnIncomeSourceRevision;
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
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
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
        List<DeliveryFactEvidence> evidence = deliveryEvidence(platformCode, request.facts());
        String factEvidenceHash = evidenceHash(evidence);

        var existingReceipt = receiptRepository.findBySourceSystemAndDeliveryId(sourceSystem, deliveryId);
        if (existingReceipt.isPresent()) {
            McnIncomeDeliveryReceipt receipt = existingReceipt.get();
            if (!platformCode.equals(receipt.getPlatformCode()) || !sameFactEvidence(receipt, sourceSystem, deliveryId, factEvidenceHash)) {
                throw new IllegalStateException("delivery id conflicts with stored raw ledger evidence");
            }
            if (receipt.getFactEvidenceHash() == null) receipt.recordFactEvidenceHash(factEvidenceHash);
            return new McnIncomeDeliveryResponse(deliveryId, "DUPLICATE_DELIVERY",
                    receipt.getFactCount(), 0, receipt.getFactCount(), 0);
        }

        int newFacts = 0;
        int duplicateFacts = 0;
        int unmatchedFacts = 0;
        Instant receivedAt = clock.instant();
        for (McnIncomeFactRequest fact : request.facts()) {
            String eventId = require(fact.sourceEventId(), "source event id");
            McnIncomeSourceRevision revisionInfo = McnIncomeSourceRevision.parse(require(fact.sourceRevision(), "source revision"));
            String revision = revisionInfo.value();
            String factPayload = json(fact.sourcePayload());
            // The source payload is retained verbatim, while the complete normalized fact is fingerprinted.
            // This prevents a changed amount, status or timestamp from being silently treated as a duplicate.
            String factHash = sha256(json(fact));
            var existingFact = eventRepository.findBySourceSystemAndPlatformCodeAndSourceEventIdAndSourceRevision(
                    sourceSystem, platformCode, eventId, revision);
            var sameVersion = eventRepository.findBySourceSystemAndPlatformCodeAndSourceEventIdAndRevisionPrefix(
                    sourceSystem, platformCode, eventId, revisionInfo.fixedWidthPrefix());
            if (sameVersion.stream().anyMatch(event -> !revision.equals(event.getSourceRevision()))) {
                throw new IllegalStateException("MCN source revision version conflicts with stored raw ledger evidence");
            }
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
                    sourceSystem, deliveryId, platformCode, require(fact.factGranularity(), "fact granularity"), eventId, revision,
                    trimToNull(fact.originalSourceEventId()), platformUserId, resolvedUserId,
                    resolutionStatus, resolutionReason, fact.eventType(), fact.settlementStatus(), fact.amount(),
                    require(fact.currencyCode(), "currency code").toUpperCase(Locale.ROOT),
                    require(fact.amountUnit(), "amount unit").toUpperCase(Locale.ROOT), fact.businessDate(),
                    require(fact.sourceTimezone(), "source timezone"), fact.periodStart(), fact.periodEnd(),
                    fact.occurredAt(), fact.settledAt(), fact.sourceUpdatedAt(), trimToNull(fact.guildId()), factHash,
                    factPayload, receivedAt, trimToNull(fact.settlementBasis())));
            newFacts++;
        }
        receiptRepository.save(McnIncomeDeliveryReceipt.accept(sourceSystem, deliveryId, platformCode, deliveryHash, factEvidenceHash,
                request.facts().size(), receivedAt, request.snapshotAt(), json(request.sourceWatermark())));
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

    private void validateV1DailyFact(String platformCode, McnIncomeFactRequest fact) {
        if (!"ACCOUNT_GUILD_DAY".equals(require(fact.factGranularity(), "fact granularity"))) {
            throw new IllegalArgumentException("MCN income fact granularity must be ACCOUNT_GUILD_DAY");
        }
        String expectedUnit = platformCode + "_DIAMOND";
        if (!expectedUnit.equals(require(fact.amountUnit(), "amount unit").toUpperCase(Locale.ROOT))) {
            throw new IllegalArgumentException("income amount unit does not match platform");
        }
        if (!fact.periodStart().isBefore(fact.periodEnd())) {
            throw new IllegalArgumentException("income fact period is invalid");
        }
        if (!"XXX".equals(require(fact.currencyCode(), "currency code").toUpperCase(Locale.ROOT))) {
            throw new IllegalArgumentException("MCN V1 income currency code must be XXX");
        }
        if (!fact.occurredAt().equals(fact.periodStart())) {
            throw new IllegalArgumentException("daily income fact occurredAt must equal periodStart");
        }
        if ((fact.eventType() == McnIncomeEventType.ADJUSTMENT || fact.eventType() == McnIncomeEventType.REVERSAL)
                && trimToNull(fact.originalSourceEventId()) == null) {
            throw new IllegalArgumentException("adjustment or reversal must reference original source event id");
        }
        if (fact.eventType() == McnIncomeEventType.REVERSAL && fact.amount().signum() != 0) {
            throw new IllegalArgumentException("daily income reversal amount must be zero");
        }
    }

    private List<DeliveryFactEvidence> deliveryEvidence(String platformCode, List<McnIncomeFactRequest> facts) {
        return facts.stream().map(fact -> {
            validateV1DailyFact(platformCode, fact);
            return new DeliveryFactEvidence(require(fact.sourceEventId(), "source event id"),
                    McnIncomeSourceRevision.parse(require(fact.sourceRevision(), "source revision")).value(), sha256(json(fact)));
        }).sorted(Comparator.comparing(DeliveryFactEvidence::sourceEventId)
                .thenComparing(DeliveryFactEvidence::sourceRevision)
                .thenComparing(DeliveryFactEvidence::payloadHash)).toList();
    }

    private boolean sameFactEvidence(McnIncomeDeliveryReceipt receipt, String sourceSystem, String deliveryId, String expectedHash) {
        if (expectedHash.equals(receipt.getFactEvidenceHash())) return true;
        List<DeliveryFactEvidence> stored = eventRepository.findBySourceSystemAndDeliveryId(sourceSystem, deliveryId).stream()
                .map(event -> new DeliveryFactEvidence(event.getSourceEventId(), event.getSourceRevision(), event.getPayloadHash()))
                .sorted(Comparator.comparing(DeliveryFactEvidence::sourceEventId)
                        .thenComparing(DeliveryFactEvidence::sourceRevision)
                        .thenComparing(DeliveryFactEvidence::payloadHash)).toList();
        return receipt.getFactCount() == stored.size() && expectedHash.equals(evidenceHash(stored));
    }

    private String evidenceHash(List<DeliveryFactEvidence> evidence) { return sha256(json(evidence)); }

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

    private record DeliveryFactEvidence(String sourceEventId, String sourceRevision, String payloadHash) { }
}
