package com.fenxiao.distribution.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;

/** Explicitly invoked diagnostics; never contacts the internet during the ordinary test suite. */
@EnabledIfSystemProperty(named = "chuanglan.sms.network-diagnostics", matches = "true")
class ChuanglanSmsNetworkDiagnosticsTest {
    @Test
    void printsThePublicIpv4UsedByTheJavaHttpClient() throws Exception {
        var client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
        var request = HttpRequest.newBuilder(URI.create("https://checkip.amazonaws.com"))
                .timeout(Duration.ofSeconds(10)).GET().build();
        var response = client.send(request, HttpResponse.BodyHandlers.ofString());
        assertThat(response.statusCode()).isEqualTo(200);
        String address = response.body().trim();
        assertThat(address).matches("^[0-9.]+$");
        System.out.println("JAVA_DIRECT_EGRESS_IP=" + address);
    }
}
