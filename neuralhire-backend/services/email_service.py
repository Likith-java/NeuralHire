import resend
import os
from dotenv import load_dotenv
from loguru import logger

load_dotenv()


def send_key_email(email: str, key: str):
    try:
        resend.api_key = os.getenv("RESEND_API_KEY")
        resend.Emails.send({
            "from": os.getenv("FROM_EMAIL", "aria@neuralhire.ai"),
            "to": email,
            "subject": "Your NeuralHire Interview Access Key",
            "html": f"""
                <h2>Your NeuralHire Interview Key</h2>
                <p>Your one-time access key is:</p>
                <h1 style='letter-spacing:8px;font-family:monospace;color:#7c6af7'>{key}</h1>
                <p>This key expires in <strong>24 hours</strong>.</p>
                <p>Enter it at the interview portal to begin your session.</p>
                <p style='color:#999'>— ARIA, NeuralHire AI Interviewer</p>
            """
        })
        logger.info(f"Key email sent to {email}")
    except Exception as e:
        logger.error(f"Email failed for {email}: {e}")


def send_welcome_email(email: str, full_name: str, company_name: str, plain_password: str):
    try:
        resend.api_key = os.getenv("RESEND_API_KEY")
        resend.Emails.send({
            "from": os.getenv("FROM_EMAIL", "aria@neuralhire.ai"),
            "to": email,
            "subject": "Welcome to NeuralHire OS — Your Login Credentials",
            "html": f"""
                <h2>Welcome to NeuralHire OS</h2>
                <p>Hi {full_name},</p>
                <p>Your NeuralHire recruiter account for <strong>{company_name}</strong> is ready.</p>
                <p>Your login email: {email}</p>
                <p>Your generated password:</p>
                <h1 style='letter-spacing:4px;font-family:monospace;color:#7c6af7'>{plain_password}</h1>
                <p>Please save this password securely — it will not be shown again.</p>
                <p>Login at: <a href='http://localhost:5173/recruiter/login'>NeuralHire Portal</a></p>
                <p>— ARIA, NeuralHire AI</p>
            """
        })
        logger.info(f"Welcome email sent to {email}")
    except Exception as e:
        logger.error(f"Welcome email failed for {email}: {e}")


def send_reset_email(email: str, full_name: str, reset_token: str):
    try:
        resend.api_key = os.getenv("RESEND_API_KEY")
        resend.Emails.send({
            "from": os.getenv("FROM_EMAIL", "aria@neuralhire.ai"),
            "to": email,
            "subject": "NeuralHire — Password Reset Request",
            "html": f"""
                <h2>Password Reset Request</h2>
                <p>Hi {full_name},</p>
                <p>Your reset token is:</p>
                <h1 style='letter-spacing:4px;font-family:monospace;color:#7c6af7'>{reset_token}</h1>
                <p>This token expires in <strong>1 hour</strong>.</p>
                <p>Use it at the reset password screen.</p>
                <p>If you did not request this, ignore this email.</p>
                <p>— ARIA, NeuralHire AI</p>
            """
        })
        logger.info(f"Reset email sent to {email}")
    except Exception as e:
        logger.error(f"Reset email failed for {email}: {e}")
