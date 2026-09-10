package com.fenxiao.platform.service;

import com.fenxiao.platform.entity.PlatformIntegrationConfig;
import com.fenxiao.platform.entity.PlatformTargetGuild;
import com.fenxiao.platform.repository.PlatformIntegrationConfigRepository;
import com.fenxiao.platform.repository.PlatformTargetGuildRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile({"local", "test"})
public class LocalPlatformIntegrationConfigSeeder implements CommandLineRunner {
    private final PlatformIntegrationConfigRepository platforms;
    private final PlatformTargetGuildRepository guilds;

    public LocalPlatformIntegrationConfigSeeder(PlatformIntegrationConfigRepository platforms,
                                                PlatformTargetGuildRepository guilds) {
        this.platforms = platforms;
        this.guilds = guilds;
    }

    @Override
    public void run(String... args) {
        platforms.saveIfAbsent(PlatformIntegrationConfig.create("LINKY", "Linky", "sid",
                "已确认 sid 与现有 linky_account 是同一个平台主账号标识。", "LEGACY_ONLY",
                "LEGACY_EVENT", "LEGACY_RULES", true));
        platforms.saveIfAbsent(PlatformIntegrationConfig.create("TIMO", "Timo", "timo_id",
                "使用 MCN 返回的 timo_id；不得以昵称、WhatsApp 或邀请码匹配。", "CREDENTIAL_PENDING",
                "DAILY_SNAPSHOT", "SHADOW_ONLY", true));
        guilds.saveIfMissing("TIMO", "MX", "22000408", "Royal Latam");
        guilds.saveIfMissing("TIMO", "ID", "11003905", "Royal ID");
        guilds.saveIfMissing("TIMO", "BR", "22000448", "Royal BR");
    }
}
