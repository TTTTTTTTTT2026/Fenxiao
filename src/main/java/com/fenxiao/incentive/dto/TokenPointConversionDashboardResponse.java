package com.fenxiao.incentive.dto;

import java.util.List;

public record TokenPointConversionDashboardResponse(long configuredConversionCount, List<TokenPointConversionResponse> conversions) {
}
