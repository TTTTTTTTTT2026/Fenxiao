package com.fenxiao.distribution;

import com.fenxiao.common.security.DistributionAccessGuard;
import com.fenxiao.common.api.ForbiddenException;
import com.fenxiao.distribution.api.ConsumerGradeProgressController;
import com.fenxiao.distribution.service.ConsumerGradeProgressService;
import com.fenxiao.distribution.service.ConsumerWorkspaceService;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class ConsumerGradeProgressControllerTest {
    @Test void checksIdentityAndVerifiedWorkspaceBeforeReadingQualifications() {
        var guard = mock(DistributionAccessGuard.class);
        var workspaces = mock(ConsumerWorkspaceService.class);
        var progress = mock(ConsumerGradeProgressService.class);
        var controller = new ConsumerGradeProgressController(guard, workspaces, progress);
        doThrow(new ForbiddenException("denied")).when(guard).assertUserAccess(2L, "another-user-token");
        assertThatThrownBy(() -> controller.get("another-user-token", 2L, "TIMO")).isInstanceOf(ForbiddenException.class);
        verifyNoInteractions(workspaces, progress);
        when(workspaces.requireVerified(1L, "LINKY")).thenReturn("LINKY");
        controller.get("own-token", 1L, "LINKY");
        var order = inOrder(guard, workspaces, progress);
        order.verify(guard).assertUserAccess(1L, "own-token");
        order.verify(workspaces).requireVerified(1L, "LINKY");
        order.verify(progress).get(1L, "LINKY");
    }
}
