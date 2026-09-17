package com.fenxiao.incentive.dto;

import java.util.List;

public record TokenPointConversionDashboardResponse(long activeConversionCount, List<TokenPointConversionResponse> conversions) {
}
