package com.queryanalyzer.backend.service;

import com.queryanalyzer.backend.domain.AlertRule;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final JavaMailSender mailSender;
    private final RestTemplate restTemplate = new RestTemplate();

    public void dispatchAlert(AlertRule rule, double currentValue) {
        String subject = "QueryAnalyzer Alert: " + rule.getApp().getName() + " - " + rule.getMetric();
        
        // Plain text fallback for webhook
        String plainBody = String.format(
            "Alert triggered for application '%s' (Environment: %s).\n\n" +
            "Metric: %s\n" +
            "Threshold: %d\n" +
            "Current Value: %.2f\n\n" +
            "Please check the QueryAnalyzer dashboard for more details.",
            rule.getApp().getName(), rule.getApp().getEnvironment(),
            rule.getMetric(), rule.getThresholdValue(), currentValue
        );

        if ("EMAIL".equalsIgnoreCase(rule.getChannel()) && rule.getEmailAddress() != null) {
            String htmlBody = buildHtmlEmailTemplate(rule, currentValue);
            sendHtmlEmail(rule.getEmailAddress(), subject, htmlBody);
        } else if ("WEBHOOK".equalsIgnoreCase(rule.getChannel()) && rule.getWebhookUrl() != null) {
            sendWebhook(rule.getWebhookUrl(), subject, plainBody);
        } else {
            log.warn("Invalid alert channel configuration for rule ID: {}", rule.getId());
        }
    }

    private void sendHtmlEmail(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            // true indicates multipart message, though we just set html content
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true); // true sets the content type to HTML
            
            mailSender.send(message);
            log.info("Alert HTML email sent to {}", to);
        } catch (Exception e) {
            log.error("Failed to send alert HTML email to {}", to, e);
        }
    }

    private void sendWebhook(String url, String subject, String body) {
        try {
            Map<String, String> payload = Map.of(
                "text", subject + "\n" + body
            );
            restTemplate.postForEntity(url, payload, String.class);
            log.info("Alert webhook sent to {}", url);
        } catch (Exception e) {
            log.error("Failed to send alert webhook to {}", url, e);
        }
    }

    private String buildHtmlEmailTemplate(AlertRule rule, double currentValue) {
        String timeString = java.time.Instant.now().atZone(ZoneId.systemDefault())
                .format(DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm:ss"));

        return """
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #e2e8f0; padding: 40px 20px; text-align: center;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5);">
                    
                    <div style="background-color: #ef4444; padding: 25px;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 600; letter-spacing: 0.5px;">
                            ⚠️ Performance Alert
                        </h1>
                    </div>
                    
                    <div style="padding: 35px; text-align: left;">
                        <p style="font-size: 16px; line-height: 1.6; color: #cbd5e1; margin-top: 0; margin-bottom: 25px;">
                            QueryAnalyzer has automatically detected a metric threshold breach in your application.
                        </p>
                        
                        <div style="background-color: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 25px;">
                            <table style="width: 100%%; border-collapse: collapse; font-size: 15px;">
                                <tr>
                                    <td style="padding: 10px 0; color: #94a3b8; width: 35%%;">Application:</td>
                                    <td style="padding: 10px 0; color: #f8fafc; font-weight: 600;">%s</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0; color: #94a3b8;">Environment:</td>
                                    <td style="padding: 10px 0; color: #f8fafc; font-weight: 600;">
                                        <span style="background-color: #3b82f6; color: white; padding: 3px 10px; border-radius: 4px; font-size: 12px; letter-spacing: 0.5px;">%s</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0; border-bottom: 1px solid #1e293b;" colspan="2"></td>
                                </tr>
                                <tr>
                                    <td style="padding: 15px 0 10px 0; color: #94a3b8;">Metric:</td>
                                    <td style="padding: 15px 0 10px 0; color: #f8fafc; font-weight: 600;">%s</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0; color: #94a3b8;">Threshold:</td>
                                    <td style="padding: 10px 0; color: #f8fafc; font-weight: 600;">%d</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0; color: #ef4444; font-weight: 600;">Current Value:</td>
                                    <td style="padding: 10px 0; color: #ef4444; font-weight: 700; font-size: 20px;">%.2f</td>
                                </tr>
                            </table>
                        </div>
                        
                        <div style="text-align: center; margin-top: 35px;">
                            <a href="http://localhost:5173/alerts" style="background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block; transition: background-color 0.2s;">View in Dashboard</a>
                        </div>
                    </div>
                    
                    <div style="background-color: #0f172a; padding: 20px; text-align: center; border-top: 1px solid #334155;">
                        <p style="color: #64748b; font-size: 13px; margin: 0; line-height: 1.5;">
                            Automated alert generated by <strong>QueryAnalyzer</strong><br>
                            Time of detection: %s
                        </p>
                    </div>
                </div>
            </div>
            """.formatted(
                rule.getApp().getName(), 
                rule.getApp().getEnvironment(), 
                rule.getMetric(), 
                rule.getThresholdValue(), 
                currentValue,
                timeString
            );
    }
}
