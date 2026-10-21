package com.fenxiao.platform.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/** BANDEIRA-owned eligibility configuration, never part of the MCN directory snapshot. */
@Entity
@Table(name = "timo_guild_country_policy")
public class TimoGuildCountryPolicy {
    @Id @Column(name = "guild_id", length = 64) private String guildId;
    @Column(name = "version_no", nullable = false) private int version;
    @Column(name = "updated_by", nullable = false) private long updatedBy;
    @Column(name = "updated_at", nullable = false) private LocalDateTime updatedAt;
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "timo_guild_accepted_country", joinColumns = @JoinColumn(name = "guild_id"),
            uniqueConstraints = @UniqueConstraint(name = "uk_timo_accepted_country", columnNames = "country_code"))
    @Column(name = "country_code", nullable = false, length = 10)
    private Set<String> countryCodes = new HashSet<>();

    protected TimoGuildCountryPolicy() {}
    public TimoGuildCountryPolicy(String guildId) { this.guildId = guildId; }
    public String getGuildId() { return guildId; }
    public int getVersion() { return version; }
    public Set<String> getCountryCodes() { return Set.copyOf(countryCodes); }
    public void replace(Set<String> countries, long actorId, LocalDateTime at) {
        countryCodes.clear(); countryCodes.addAll(countries); version++; updatedBy = actorId; updatedAt = at;
    }
}
