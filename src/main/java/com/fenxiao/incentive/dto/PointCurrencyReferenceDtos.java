package com.fenxiao.incentive.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/** Decimal amounts are strings on output; consumers must not recalculate money with floats. */
public final class PointCurrencyReferenceDtos {
    private PointCurrencyReferenceDtos() { }

    public record Country(String countryCode, String countryName, String currencyCode, int fractionDigits) { }
    public record Rate(long id, int version, String currencyPerPoint, boolean enabled, String status,
                       Instant effectiveAt, long createdBy, Instant createdAt) { }
    public record Setting(Country country, int latestVersion, Rate current, Rate scheduled) { }
    public record Dashboard(boolean referenceOnly, Instant generatedAt, List<Setting> settings) { }
    public record History(List<Rate> items, Integer nextBeforeVersion) { }
    public record SaveRequest(@NotNull Boolean enabled,
                              @DecimalMin(value="0",inclusive=false) @Digits(integer=12,fraction=8) BigDecimal currencyPerPoint,
                              Instant effectiveAt, @NotNull @Min(0) Integer expectedVersion) { }
    public record PreviewRequest(@NotNull @DecimalMin("0") @Digits(integer=12,fraction=6) BigDecimal points,
                                 String countryCode, @Positive Long userId) { }
    public record Quote(boolean referenceOnly, String status, String countryCode, String currencyCode,
                        String points, String currencyPerPoint, String amount, Long rateVersionId,
                        Instant effectiveAt, Instant evaluatedAt) { }
}
