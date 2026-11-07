package com.fenxiao.admin.api;

import com.fenxiao.admin.service.AdminPermission;
import com.fenxiao.admin.service.AdminSessionService;
import com.fenxiao.audit.entity.OperationAuditLog;
import com.fenxiao.audit.repository.OperationAuditLogRepository;
import com.fenxiao.common.api.ForbiddenException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import javax.imageio.ImageIO;
import javax.imageio.stream.MemoryCacheImageInputStream;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Map;

@RestController
public class TimoInvitationArtworkController {
    private static final Map<String, Long> LOCALE_IDS = Map.of("zh", 1L, "id", 2L, "en", 3L, "es", 4L, "pt", 5L);
    private static final int MAX_BYTES = 1024 * 1024;
    private static final int MAX_SIDE = 2400;

    private final JdbcTemplate jdbc;
    private final AdminSessionService sessions;
    private final OperationAuditLogRepository audits;

    public TimoInvitationArtworkController(JdbcTemplate jdbc, AdminSessionService sessions,
                                          OperationAuditLogRepository audits) {
        this.jdbc = jdbc;
        this.sessions = sessions;
        this.audits = audits;
    }

    @GetMapping("/api/distribution/content/timo-invitation/{locale}")
    public ResponseEntity<byte[]> read(@PathVariable String locale) {
        if (!LOCALE_IDS.containsKey(locale)) return ResponseEntity.notFound().build();
        return jdbc.query("SELECT media_type,image_bytes FROM timo_invitation_artwork WHERE locale=?",
                (row, index) -> ResponseEntity.ok()
                        .cacheControl(CacheControl.noStore())
                        .header("X-Content-Type-Options", "nosniff")
                        .contentType(MediaType.parseMediaType(row.getString("media_type")))
                        .body(row.getBytes("image_bytes")), locale)
                .stream().findFirst().orElseGet(() -> ResponseEntity.notFound().cacheControl(CacheControl.noStore()).build());
    }

    @PostMapping(path = "/admin/content/timo-invitation/{locale}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional
    public ResponseEntity<Void> replace(@RequestHeader(value = "X-Admin-Session", required = false) String token,
                                        @PathVariable String locale, @RequestParam("image") MultipartFile image,
                                        HttpServletRequest request) throws IOException {
        var actor = sessions.assertPermission(token, AdminPermission.WRITE);
        actor.requireScope("TIMO", null, null);
        if (!unrestricted(actor.guildScope()) || !unrestricted(actor.regionScope())) {
            throw new ForbiddenException("global content scope required");
        }
        if (!LOCALE_IDS.containsKey(locale)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported language");
        if (image.isEmpty() || image.getSize() > MAX_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image must be at most 1 MiB");
        }
        byte[] bytes = image.getBytes();
        String mediaType = validateImage(bytes);
        jdbc.update("""
                INSERT INTO timo_invitation_artwork (locale, media_type, image_bytes) VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE media_type=VALUES(media_type), image_bytes=VALUES(image_bytes)
                """, locale, mediaType, bytes);
        audits.save(OperationAuditLog.create(actor.accountId(), actor.role(), "CONTENT_MANAGEMENT",
                "TIMO_INVITATION_ARTWORK", LOCALE_IDS.get(locale), "REPLACE", null, null, request.getRemoteAddr(),
                locale + " " + mediaType + " " + bytes.length + " bytes", LocalDateTime.now(ZoneOffset.UTC)));
        return ResponseEntity.noContent().build();
    }

    private static boolean unrestricted(String scope) {
        return scope == null || scope.isBlank() || "*".equals(scope.trim());
    }

    private static String validateImage(byte[] bytes) {
        try (var input = new MemoryCacheImageInputStream(new ByteArrayInputStream(bytes))) {
            var readers = ImageIO.getImageReaders(input);
            if (readers.hasNext()) {
                var reader = readers.next();
                try {
                    String mediaType = switch (reader.getFormatName().toLowerCase(java.util.Locale.ROOT)) {
                        case "png" -> MediaType.IMAGE_PNG_VALUE;
                        case "jpeg" -> MediaType.IMAGE_JPEG_VALUE;
                        default -> null;
                    };
                    if (mediaType != null) {
                        reader.setInput(input, true, true);
                        int width = reader.getWidth(0);
                        int height = reader.getHeight(0);
                        if (width > 0 && height > 0 && width <= MAX_SIDE && height <= MAX_SIDE && reader.read(0) != null) {
                            return mediaType;
                        }
                    }
                } finally {
                    reader.dispose();
                }
            }
        } catch (IOException | RuntimeException ignored) {
            // Malformed image data is a client error.
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Use a valid PNG or JPEG, up to 2400 pixels per side");
    }
}
