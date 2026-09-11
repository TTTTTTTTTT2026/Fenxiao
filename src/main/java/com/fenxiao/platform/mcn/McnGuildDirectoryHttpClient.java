package com.fenxiao.platform.mcn;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fenxiao.platform.entity.McnGuildDirectoryItem;
import com.fenxiao.platform.service.McnGuildDirectoryClient;
import com.fenxiao.platform.service.McnGuildDirectorySnapshot;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.stereotype.Component;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.*;
import java.util.*;

@Component
@EnableConfigurationProperties(McnGuildDirectoryProperties.class)
public class McnGuildDirectoryHttpClient implements McnGuildDirectoryClient {
    private static final String PATH = "/api/external/guild-directory/v1/snapshots/"; private static final String SCOPE = "guild_directory.read";
    private final McnGuildDirectoryProperties properties; private final ObjectMapper json; private final Clock clock; private final HttpClient http; private final SecureRandom random = new SecureRandom();
    public McnGuildDirectoryHttpClient(McnGuildDirectoryProperties p, ObjectMapper json, Clock clock) { this(p, json, clock, HttpClient.newBuilder().connectTimeout(p.getConnectTimeout()).build()); }
    McnGuildDirectoryHttpClient(McnGuildDirectoryProperties p, ObjectMapper json, Clock clock, HttpClient http) { this.properties = p; this.json = json; this.clock = clock; this.http = http; }
    @Override public boolean enabled() { return properties.isConfigured(); }
    @Override public McnGuildDirectorySnapshot fetchCompleteSnapshot(String requestedPlatform) {
        if (!enabled()) throw new IllegalStateException("MCN guild directory client is not configured");
        String platform = requestedPlatform.trim().toUpperCase(Locale.ROOT), cursor = null, snapshotId = null, version = null, checksum = null, scope = null; LocalDateTime at = null, expires = null; List<McnGuildDirectoryItem> all = new ArrayList<>();
        do { JsonNode page = fetch(platform, cursor, snapshotId); if (!page.path("ok").asBoolean() || !"1".equals(page.path("apiVersion").asText()) || !platform.equals(page.path("platform").asText())) throw new IllegalStateException("MCN guild directory response is invalid");
            String nextId = required(page, "snapshotId"), nextVersion = required(page, "snapshotVersion"), nextChecksum = required(page, "snapshotChecksum"), nextScope = required(page, "directoryScope");
            if (snapshotId != null && (!snapshotId.equals(nextId) || !version.equals(nextVersion) || !checksum.equals(nextChecksum) || !scope.equals(nextScope))) throw new IllegalStateException("MCN guild directory snapshot changed during pagination");
            snapshotId = nextId; version = nextVersion; checksum = nextChecksum; scope = nextScope; at = time(page.path("snapshotAt").asText()); expires = time(page.path("snapshotExpiresAt").asText());
            for (JsonNode item : page.path("items")) { if (!platform.equals(item.path("platform").asText())) throw new IllegalStateException("MCN guild directory item platform mismatch"); all.add(new McnGuildDirectoryItem(required(item,"guildId"), required(item,"guildName"), required(item,"guildStatus"), text(item,"country"), time(text(item,"recordUpdatedAt")), time(text(item,"officialUpdatedAt")), text(item,"sourceVersion"), text(item,"joinInstruction"))); }
            cursor = page.path("isLastPage").asBoolean() ? null : required(page, "nextCursor");
        } while (cursor != null);
        return new McnGuildDirectorySnapshot(platform, true, scope, snapshotId, version, checksum, at, expires, List.copyOf(all));
    }
    private JsonNode fetch(String platform, String cursor, String snapshotId) { try { Map<String,String> q = new TreeMap<>(); q.put("pageSize", Integer.toString(Math.min(100, Math.max(1, properties.getPageSize())))); if (cursor != null) { q.put("cursor", cursor); q.put("snapshotId", snapshotId); } String query = q.entrySet().stream().map(e -> encode(e.getKey())+"="+encode(e.getValue())).reduce((a,b)->a+"&"+b).orElse(""); String path = PATH + platform + "?" + query, requestId = UUID.randomUUID().toString(), nonce = nonce(); long timestamp = clock.instant().getEpochSecond(); String canonical = String.join("\n", "GET", path, SCOPE, Long.toString(timestamp), nonce, requestId, "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"); HttpRequest request = HttpRequest.newBuilder(URI.create(trimBase()+path)).timeout(properties.getRequestTimeout()).header("X-MCN-Credential-Id", properties.getCredentialId()).header("X-MCN-Scope", SCOPE).header("X-MCN-Timestamp", Long.toString(timestamp)).header("X-MCN-Nonce", nonce).header("X-Request-Id", requestId).header("X-Idempotency-Key", requestId).header("X-MCN-Signature", hmac(canonical)).GET().build(); HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString()); if (response.statusCode()<200 || response.statusCode()>=300) throw new IllegalStateException("MCN guild directory request failed: HTTP "+response.statusCode()); return json.readTree(response.body()); } catch (Exception e) { throw e instanceof IllegalStateException x ? x : new IllegalStateException("MCN guild directory transport failure", e); } }
    private String trimBase(){ return properties.getBaseUrl().replaceAll("/+$",""); } private String nonce(){ byte[] b=new byte[16];random.nextBytes(b);return HexFormat.of().formatHex(b); } private String encode(String v){ return URLEncoder.encode(v, StandardCharsets.UTF_8).replace("+","%20").replace("%7E","~"); } private String hmac(String value){ try { Mac mac=Mac.getInstance("HmacSHA256");mac.init(new SecretKeySpec(properties.getHmacSecret().getBytes(StandardCharsets.UTF_8),"HmacSHA256"));return HexFormat.of().formatHex(mac.doFinal(value.getBytes(StandardCharsets.UTF_8))); } catch(Exception e){throw new IllegalStateException("MCN guild directory signing failure",e);} } private String required(JsonNode n,String f){String v=text(n,f);if(v==null)throw new IllegalStateException("MCN guild directory field missing: "+f);return v;} private String text(JsonNode n,String f){String v=n.path(f).asText(null);return v==null||v.isBlank()?null:v;} private LocalDateTime time(String value){return value==null?null:OffsetDateTime.parse(value).toLocalDateTime();}
}
