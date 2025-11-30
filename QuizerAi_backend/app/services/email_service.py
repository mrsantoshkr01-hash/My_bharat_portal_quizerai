# app/services/email_service.py
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from jinja2 import Template
import os
from fastapi import HTTPException
import traceback

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USERNAME", "support@quizerai.com")
        self.smtp_password = os.getenv("SMTP_PASSWORD")  # App password for Gmail
        self.from_email = os.getenv("FROM_EMAIL", "support@quizerai.com")
        self.from_name = os.getenv("FROM_NAME", "QuizerAI Support")
        
        if not self.smtp_password:
            logger.warning("SMTP_PASSWORD not set. Email functionality will be limited.")

    def send_email(self, to_email: str, subject: str, html_content: str, text_content: Optional[str] = None) -> bool:
        """Send an email with HTML content"""
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = to_email

            # Add text part if provided
            if text_content:
                part1 = MIMEText(text_content, 'plain')
                msg.attach(part1)

            # Add HTML part
            part2 = MIMEText(html_content, 'html')
            msg.attach(part2)

            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)

            logger.info(f"Email sent successfully to {to_email}")
            return True

        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False

    def send_otp_email(self, to_email: str, otp_code: str, user_name: str, otp_type: str = "registration") -> bool:
        """Send OTP verification email"""
        
        # Email templates
        if otp_type == "registration":
            subject = "Welcome to QuizerAI - Verify Your Email"
            html_template = """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome to QuizerAI</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
                    .container { max-width: 600px; margin: 0 auto; background-color: white; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
                    .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 600; }
                    .content { padding: 40px 20px; }
                    .otp-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px; text-align: center; margin: 30px 0; }
                    .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 10px 0; }
                    .footer { background-color: #f1f5f9; padding: 20px; text-align: center; color: #64748b; }
                    .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎓 Welcome to QuizerAI!</h1>
                    </div>
                    <div class="content">
                        <h2>Hi {{ user_name }},</h2>
                        <p>Thank you for joining QuizerAI! We're excited to have you on board.</p>
                        <p>To complete your registration and start your learning journey, please verify your email address using the OTP code below:</p>
                        
                        <div class="otp-box">
                            <p style="margin: 0; font-size: 16px;">Your verification code is:</p>
                            <div class="otp-code">{{ otp_code }}</div>
                            <p style="margin: 0; font-size: 14px; opacity: 0.9;">This code will expire in 10 minutes</p>
                        </div>
                        
                        <p><strong>Important:</strong></p>
                        <ul>
                            <li>This code is valid for 10 minutes only</li>
                            <li>Do not share this code with anyone</li>
                            <li>If you didn't create an account, please ignore this email</li>
                        </ul>
                        
                        <p>Once verified, you'll be able to:</p>
                        <ul>
                            <li>🚀 Create and take AI-powered quizzes</li>
                            <li>📊 Track your learning progress</li>
                            <li>🎯 Get personalized recommendations</li>
                            <li>👥 Join study groups and compete with friends</li>
                        </ul>
                        
                        <p>If you have any questions, feel free to reach out to our support team.</p>
                        
                        <p>Best regards,<br>The QuizerAI Team</p>
                    </div>
                    <div class="footer">
                        <p>© 2025 QuizerAI. All rights reserved.</p>
                        <p>If you didn't sign up for QuizerAI, please ignore this email.</p>
                    </div>
                </div>
            </body>
            </html>
            """
        else:
            subject = "QuizerAI - Email Verification Required"
            html_template = """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Email Verification - QuizerAI</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
                    .container { max-width: 600px; margin: 0 auto; background-color: white; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
                    .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 600; }
                    .content { padding: 40px 20px; }
                    .otp-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px; text-align: center; margin: 30px 0; }
                    .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 10px 0; }
                    .footer { background-color: #f1f5f9; padding: 20px; text-align: center; color: #64748b; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔐 Email Verification</h1>
                    </div>
                    <div class="content">
                        <h2>Hi {{ user_name }},</h2>
                        <p>Please use the following verification code to verify your email address:</p>
                        
                        <div class="otp-box">
                            <p style="margin: 0; font-size: 16px;">Your verification code is:</p>
                            <div class="otp-code">{{ otp_code }}</div>
                            <p style="margin: 0; font-size: 14px; opacity: 0.9;">This code will expire in 10 minutes</p>
                        </div>
                        
                        <p>If you didn't request this verification, please ignore this email.</p>
                        
                        <p>Best regards,<br>The QuizerAI Team</p>
                    </div>
                    <div class="footer">
                        <p>© 2025 QuizerAI. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """

        # Render template
        template = Template(html_template)
        html_content = template.render(user_name=user_name, otp_code=otp_code)
        
        # Text version for accessibility
        text_content = f"""
        Hi {user_name},
        
        Your QuizerAI verification code is: {otp_code}
        
        This code will expire in 10 minutes.
        
        If you didn't request this, please ignore this email.
        
        Best regards,
        The QuizerAI Team
        """

        return self.send_email(to_email, subject, html_content, text_content)

    def send_welcome_email(self, to_email: str, user_name: str) -> bool:
        """Send welcome email after successful verification"""
        subject = "🎉 Welcome to QuizerAI - Let's Start Learning!"
        
        html_template = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to QuizerAI</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
                .container { max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
                .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 600; }
                .content { padding: 40px 20px; }
                .feature-box { background-color: #f1f5f9; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #667eea; }
                .feature-box h3 { margin-top: 0; color: #1e293b; font-size: 18px; }
                .feature-box ul { margin: 10px 0; padding-left: 20px; }
                .feature-box li { margin: 8px 0; color: #475569; }
                
                /* Improved Founder Section */
                .founder-message { 
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; 
                    border: none; 
                    border-radius: 12px; 
                    position: relative; 
                    overflow: hidden; 
                    padding: 30px 25px;
                    margin: 20px 0;
                }
                
                .founder-message h3 {
                    margin: 0 0 25px 0;
                    font-size: 20px;
                    font-weight: 600;
                    text-align: center;
                }
                
                .founder-content { 
                    position: relative; 
                    z-index: 2; 
                }
                
                /* Quote Section */
                .founder-quote { 
                    margin-bottom: 25px; 
                    padding: 20px; 
                    background: rgba(255, 255, 255, 0.1); 
                    border-radius: 12px; 
                    border-left: 4px solid #ffd700; 
                    backdrop-filter: blur(10px);
                }
                
                .founder-quote p { 
                    font-size: 16px; 
                    line-height: 1.6; 
                    margin: 0; 
                    font-style: italic; 
                    text-align: center;
                }
                
                /* Profile Section - Now Stacked Vertically */
                .founder-profile {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    align-items: center;
                }
                
                .founder-info { 
                    display: flex; 
                    align-items: center; 
                    gap: 15px;
                    justify-content: center;
                }
                
                .founder-avatar { 
                    width: 70px; 
                    height: 70px; 
                    border-radius: 50%; 
                    background: linear-gradient(135deg, #ffd700, #ffed4e); 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    box-shadow: 0 4px 20px rgba(255, 215, 0, 0.3); 
                    flex-shrink: 0;
                }
                
                .founder-initial { 
                    font-size: 28px; 
                    font-weight: bold; 
                    color: #333; 
                }
                
                .founder-text { 
                     
                    text-align: center;
                }
                
                .founder-name {
                    font-size: 18px; 
                    font-weight: 600;
                    margin-bottom: 3px;
                    line-height: 1.2;
                }
                
                .founder-title { 
                    font-size: 14px; 
                    opacity: 0.9; 
                    font-weight: 300; 
                    line-height: 1.2;
                }
                
                /* Personal Message - Now Full Width */
                .founder-wishes { 
                    padding: 20px; 
                    background: rgba(255, 255, 255, 0.08); 
                    border-radius: 12px; 
                    border: 1px solid rgba(255, 255, 255, 0.15); 
                    width: 100%;
                    box-sizing: border-box;
                }
                
                .founder-wishes p { 
                    margin: 0; 
                    font-size: 15px; 
                    line-height: 1.6; 
                    text-align: center; 
                    font-style: italic;
                }
                
                .button { 
                    display: inline-block; 
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white !important; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 8px; 
                    font-weight: 600; 
                    margin: 20px 0; 
                    font-size: 16px; 
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); 
                }
                
                .button:hover { opacity: 0.9; }
                .footer { background-color: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
                
                /* Mobile Responsiveness */
                @media (max-width: 480px) {
                    .content { padding: 20px 15px; }
                    .feature-box { padding: 15px; margin: 15px 0; }
                    
                    .founder-message { 
                        padding: 20px 15px; 
                        margin: 15px 0;
                    }
                    
                    .founder-message h3 {
                        font-size: 18px;
                        margin-bottom: 20px;
                    }
                    
                    .founder-quote { 
                        padding: 15px; 
                        margin-bottom: 20px;
                    }
                    
                    .founder-quote p { 
                        font-size: 14px; 
                        line-height: 1.5;
                    }
                    
                    .founder-avatar { 
                        width: 60px; 
                        height: 60px; 
                    }
                    
                    .founder-initial { 
                        font-size: 24px; 
                    }
                    
                    .founder-name { 
                        font-size: 16px; 
                    }
                    
                    .founder-title { 
                        font-size: 13px; 
                    }
                    
                    .founder-wishes { 
                        padding: 15px; 
                    }
                    
                    .founder-wishes p { 
                        font-size: 14px; 
                        line-height: 1.5;
                    }
                    
                    .button { padding: 12px 24px; font-size: 14px; }
                }
                
                /* Tablet and larger screens */
                @media (min-width: 768px) {
                    .header h1 { font-size: 32px; }
                    .content { padding: 40px 30px; }
                    
                    .founder-message {
                        padding: 35px 30px;
                    }
                    
                    .founder-quote p { 
                        font-size: 17px; 
                        line-height: 1.7; 
                    }
                    
                    .founder-name { 
                        font-size: 19px; 
                    }
                    
                    .founder-title { 
                        font-size: 15px; 
                    }
                    
                    .founder-wishes p { 
                        font-size: 16px; 
                        line-height: 1.7;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Welcome to QuizerAI!</h1>
                </div>
                <div class="content">
                    <h2>Congratulations, {{ user_name }}!</h2>
                    <p>Your email has been successfully verified, and your QuizerAI account is now active. Welcome to the future of intelligent learning!</p>
                    
                    <div class="feature-box">
                        <h3>🚀 What's Next?</h3>
                        <p>Here are some things you can do to get started:</p>
                        <ul>
                            <li>Complete your profile setup</li>
                            <li>Take your first AI-powered quiz</li>
                            <li>Explore our extensive question bank</li>
                            <li>Join study groups in your area of interest</li>
                        </ul>
                    </div>
                    
                    <div class="feature-box">
                        <h3>✨ Features You'll Love</h3>
                        <ul>
                            <li><strong>AI-Powered Quizzes:</strong> Personalized questions that adapt to your learning style</li>
                            <li><strong>Progress Tracking:</strong> Detailed analytics to monitor your improvement</li>
                            <li><strong>Smart Recommendations:</strong> AI suggests topics and study materials</li>
                            <li><strong>Community Learning:</strong> Connect with learners worldwide</li>
                        </ul>
                    </div>
                    
                    <div class="feature-box founder-message">
                        <h3>💝 Best Wishes from the Founder</h3>
                        <div class="founder-content">
                            <!-- Inspirational Quote -->
                            <div class="founder-quote">
                                <p>"Education is the most powerful weapon which you can use to change the world. At QuizerAI, we're not just building quizzes – we're crafting the future of personalized learning."</p>
                            </div>
                            
                            <!-- Founder Profile and Message -->
                            <div class="founder-profile">
                                <!-- Profile Info -->
                                <div class="founder-info">
                                    
                                    <div class="founder-text">
                                        <div class="founder-name">Kunal Kumar</div>
                                        <div class="founder-title">Founder & CEO, QuizerAI</div>
                                    </div>
                                </div>
                                
                               
                            </div>
                        </div>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{{ app_url }}/dashboard" class="button">Start Learning Now</a>
                    </div>
                    
                    <p>If you have any questions or need help getting started, don't hesitate to reach out to our support team at support@quizerai.com</p>
                    
                    <p>Happy learning!<br>The QuizerAI Team</p>
                </div>
                <div class="footer">
                    <p>© 2025 QuizerAI. All rights reserved.</p>
                    <p>Need help? Contact us at support@quizerai.com</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Get app URL from environment or use default
        app_url = os.getenv("FRONTEND_URL", "https://quizerai.com")
        
        template = Template(html_template)
        html_content = template.render(user_name=user_name, app_url=app_url)
        
        text_content = f"""
        Congratulations, {user_name}!
        
        Your QuizerAI account is now active. Welcome to the future of intelligent learning!
        
        Get started by:
        - Completing your profile setup
        - Taking your first AI-powered quiz
        - Exploring our question bank
        - Joining study groups
        
        Visit: {app_url}/dashboard
        
        If you need help, contact us at support@quizerai.com
        
        Happy learning!
        The QuizerAI Team
        """
        
        return self.send_email(to_email, subject, html_content, text_content)
    
    
    
    def send_assignment_email(self, to_email: str, student_name: str, assignment, teacher_name: str) -> bool:
        """Send assignment notification email to student with enhanced error handling"""
        
        try:
            logger.info(f"Preparing assignment email for {to_email}")
            
            subject = f"New Quiz Assignment: {assignment.title}"
            
            # Safely get assignment data with defaults
            try:
                classroom_name = assignment.classroom.name if assignment.classroom else "Unknown Classroom"
                quiz_title = assignment.quiz.title if assignment.quiz else assignment.title
                total_questions = assignment.quiz.total_questions if assignment.quiz and hasattr(assignment.quiz, 'total_questions') else "N/A"
                quiz_time = assignment.quiz.total_time_minutes if assignment.quiz and hasattr(assignment.quiz, 'total_time_minutes') else None
                time_limit = assignment.time_limit_minutes or quiz_time or "N/A"
                
                # Handle due date safely
                due_date_formatted = None
                if assignment.due_date:
                    try:
                        due_date_formatted = assignment.due_date.strftime("%B %d, %Y at %I:%M %p")
                    except Exception as date_error:
                        logger.warning(f"Date formatting error: {date_error}")
                        due_date_formatted = str(assignment.due_date)
                
                logger.info(f"Assignment data prepared: {classroom_name}, {total_questions} questions, {time_limit} minutes")
                
            except Exception as data_error:
                logger.error(f"Error preparing assignment data: {str(data_error)}")
                # Use safe defaults
                classroom_name = "Your Classroom"
                quiz_title = assignment.title
                total_questions = "Multiple"
                time_limit = "N/A"
                due_date_formatted = None
            
            html_template = """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>New Quiz Assignment</title>
                <style>
                    body { 
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                        margin: 0; 
                        padding: 0; 
                        background-color: #f8fafc; 
                        line-height: 1.6;
                    }
                    .container { 
                        max-width: 600px; 
                        margin: 0 auto; 
                        background-color: white; 
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    }
                    .header { 
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        padding: 30px 20px; 
                        text-align: center; 
                    }
                    .header h1 { 
                        color: white; 
                        margin: 0; 
                        font-size: 24px; 
                        font-weight: 600; 
                    }
                    .content { 
                        padding: 30px 20px; 
                    }
                    .assignment-box { 
                        background: #f8fafc; 
                        border: 2px solid #e2e8f0; 
                        border-radius: 12px; 
                        padding: 20px; 
                        margin: 20px 0; 
                    }
                    .assignment-box h3 {
                        margin-top: 0;
                        color: #1a202c;
                        font-size: 18px;
                    }
                    .detail-row {
                        margin: 10px 0;
                        font-size: 14px;
                    }
                    .detail-row strong {
                        color: #2d3748;
                    }
                    .button { 
                        display: inline-block; 
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white !important; 
                        padding: 12px 24px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-weight: 600; 
                        margin: 20px 0; 
                        font-size: 16px;
                    }
                    .footer { 
                        background-color: #f1f5f9; 
                        padding: 20px; 
                        text-align: center; 
                        color: #64748b; 
                        font-size: 14px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📚 New Quiz Assignment</h1>
                    </div>
                    <div class="content">
                        <h2>Hi {{ student_name }},</h2>
                        <p><strong>{{ teacher_name }}</strong> has assigned you a new quiz in <strong>{{ classroom_name }}</strong>.</p>
                        
                        <div class="assignment-box">
                            <h3>{{ assignment_title }}</h3>
                            
                            <div class="detail-row">
                                <strong>Questions:</strong> {{ total_questions }}
                            </div>
                            
                            <div class="detail-row">
                                <strong>Time Limit:</strong> {{ time_limit }} minutes
                            </div>
                            
                            {% if due_date %}
                            <div class="detail-row">
                                <strong>Due Date:</strong> {{ due_date }}
                            </div>
                            {% endif %}
                            
                            {% if instructions %}
                            <div class="detail-row">
                                <strong>Instructions:</strong> {{ instructions }}
                            </div>
                            {% endif %}
                        </div>
                        
                        <div style="text-align: center;">
                            <a href="{{ app_url }}/student/assignments" class="button">Take Quiz Now</a>
                        </div>
                        
                        <p style="margin-top: 30px;">
                            Log in to your QuizerAI account to access this assignment. If you have any questions, please contact your teacher or our support team.
                        </p>
                        
                        <p>Best regards,<br>The QuizerAI Team</p>
                    </div>
                    <div class="footer">
                        <p>© 2025 QuizerAI. All rights reserved.</p>
                        <p>This email was sent because you are enrolled in {{ classroom_name }}</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            app_url = os.getenv("FRONTEND_URL", "https://quizerai.com")
            
            # Render template safely
            try:
                template = Template(html_template)
                html_content = template.render(
                    student_name=student_name,
                    teacher_name=teacher_name,
                    classroom_name=classroom_name,
                    assignment_title=quiz_title,
                    total_questions=total_questions,
                    time_limit=time_limit,
                    due_date=due_date_formatted,
                    instructions=getattr(assignment, 'instructions', ''),
                    app_url=app_url
                )
                
                logger.info(f"Email template rendered successfully for {to_email}")
                
            except Exception as template_error:
                logger.error(f"Template rendering error: {str(template_error)}")
                logger.error(f"Template error traceback: {traceback.format_exc()}")
                return False
            
            # Create text version
            text_content = f"""
    Hi {student_name},

    {teacher_name} has assigned you a new quiz: {quiz_title}

    Details:
    - Classroom: {classroom_name}
    - Questions: {total_questions}
    - Time Limit: {time_limit} minutes
    {f'- Due Date: {due_date_formatted}' if due_date_formatted else ''}

    Visit {app_url}/student/assignments to take the quiz.

    Best regards,
    The QuizerAI Team
            """
            
            # Send email using the enhanced send_email method
            result = self.send_email(to_email, subject, html_content, text_content)
            
            if isinstance(result, dict):
                success = result.get("success", False)
                if not success:
                    logger.error(f"Assignment email failed for {to_email}: {result.get('message', 'Unknown error')}")
                return success
            else:
                # Fallback for boolean return
                return result
            
        except Exception as e:
            logger.error(f"Failed to send assignment email to {to_email}: {str(e)}")
            logger.error(f"Assignment email traceback: {traceback.format_exc()}")
            return False