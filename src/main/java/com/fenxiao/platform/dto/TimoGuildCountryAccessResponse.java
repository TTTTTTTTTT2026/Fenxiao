package com.fenxiao.platform.dto;

import java.util.List;

public record TimoGuildCountryAccessResponse(String guildId, String guildName, String mcnCountry,
                                            int version, boolean managed, List<String> countryCodes,
                                            List<CountryOption> countryOptions) {
    public record CountryOption(String code, String name) {}
}
