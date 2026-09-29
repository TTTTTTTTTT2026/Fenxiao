package com.fenxiao.user.api;

import com.fenxiao.distribution.service.DistributionBindingService;
import com.fenxiao.identity.service.UserSessionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.Base64;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ActiveProfiles("test")
@AutoConfigureMockMvc
@Transactional
@SpringBootTest
class UserPublicProfileControllerTest {
    @Autowired MockMvc mvc;
    @Autowired DistributionBindingService bindings;
    @Autowired UserSessionService sessions;

    @Test
    void ownerCanUpdateNicknameAndAvatarWithoutReviewButOtherUsersCannot() throws Exception {
        bindings.createProfile(9140001L, "BR", "pt-br", null);
        bindings.createProfile(9140002L, "BR", "pt-br", null);
        String token = sessions.issue(9140001L).accessToken();
        String image = pngDataUrl();

        mvc.perform(post("/api/distribution/public-profiles/9140001/nickname")
                        .header("X-Distribution-Token", token).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nickname\":\"  Nova Star  \"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.nickname").value("Nova Star"));
        mvc.perform(post("/api/distribution/public-profiles/9140001/avatar")
                        .header("X-Distribution-Token", token).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"dataUrl\":\"" + image + "\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.avatarDataUrl").value(image));
        mvc.perform(get("/api/distribution/public-profiles/9140001")
                        .header("X-Distribution-Token", token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.nickname").value("Nova Star"));
        mvc.perform(get("/api/distribution/public-profiles/9140002")
                        .header("X-Distribution-Token", token))
                .andExpect(status().isForbidden());
    }

    @Test
    void rejectsOversizeAvatarAndInvalidNickname() throws Exception {
        bindings.createProfile(9140010L, "BR", "pt-br", null);
        String token = sessions.issue(9140010L).accessToken();
        mvc.perform(post("/api/distribution/public-profiles/9140010/nickname")
                        .header("X-Distribution-Token", token).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nickname\":\"   \"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/distribution/public-profiles/9140010/avatar")
                        .header("X-Distribution-Token", token).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"dataUrl\":\"data:image/png;base64,ZmFrZQ==\"}"))
                .andExpect(status().isBadRequest());
    }

    private String pngDataUrl() throws Exception {
        BufferedImage image = new BufferedImage(1, 1, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        ImageIO.write(image, "png", output);
        return "data:image/png;base64," + Base64.getEncoder().encodeToString(output.toByteArray());
    }
}
