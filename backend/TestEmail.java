import java.util.Properties;
import jakarta.mail.*;
import jakarta.mail.internet.*;

public class TestEmail {
    public static void main(String[] args) {
        String username = "viraj.lakshitha.22222@gmail.com";
        String password = "1234";

        Properties props = new Properties();
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.host", "smtp.gmail.com");
        props.put("mail.smtp.port", "587");

        System.out.println("Attempting to connect to Gmail...");
        Session session = Session.getInstance(props, new Authenticator() {
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication(username, password);
            }
        });

        try {
            Transport transport = session.getTransport("smtp");
            transport.connect("smtp.gmail.com", username, password);
            System.out.println("SUCCESS! Authentication worked!");
            transport.close();
        } catch (MessagingException e) {
            System.out.println("FAILED! Authentication rejected.");
            e.printStackTrace();
        }
    }
}
