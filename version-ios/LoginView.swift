import SwiftUI

struct LoginView: View {
    @State private var email = ""
    @State private var password = ""
    
    var body: some View {
        ZStack {
            AppTheme.background.ignoresSafeArea()
            
            VStack(spacing: 40) {
                // Header
                VStack(spacing: 8) {
                    Text("Login")
                        .font(.system(size: 32, weight: .bold))
                        .foregroundColor(AppTheme.primary)
                }
                .padding(.top, 60)
                
                // Form
                VStack(spacing: 16) {
                    // Email
                    HStack {
                        Image(systemName: "envelope")
                            .foregroundColor(.secondary)
                        TextField("Email", text: $email)
                            .font(.system(size: 16))
                    }
                    .padding()
                    .background(Color.white)
                    .cornerRadius(16)
                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.gray.opacity(0.2), lineWidth: 1))
                    
                    // Password
                    HStack {
                        Image(systemName: "lock")
                            .foregroundColor(.secondary)
                        SecureField("Password", text: $password)
                            .font(.system(size: 16))
                        Image(systemName: "eye.slash")
                            .foregroundColor(.secondary)
                    }
                    .padding()
                    .background(Color.white)
                    .cornerRadius(16)
                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.gray.opacity(0.2), lineWidth: 1))
                    
                    // Forgot Password
                    Text("Forgot Password?")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(AppTheme.primary)
                        .frame(maxWidth: .infinity, alignment: .trailing)
                    
                    // Login Button
                    Button(action: {}) {
                        Text("Login")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 56)
                            .background(AppTheme.primary)
                            .cornerRadius(28)
                    }
                    
                    // Divider
                    Text("or")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.secondary)
                        .padding(.vertical, 8)
                    
                    // Social Buttons
                    VStack(spacing: 12) {
                        SocialButton(title: "Continue with Google", icon: "g.circle.fill", color: .gray.opacity(0.1))
                        SocialButton(title: "Continue with Apple", icon: "apple.logo", color: AppTheme.accent.opacity(0.6))
                        SocialButton(title: "Continue As Guest", icon: "person.circle", color: .gray.opacity(0.1))
                    }
                    
                    // Signup
                    HStack {
                        Text("Need an account?")
                            .foregroundColor(.secondary)
                        Text("Sign up")
                            .fontWeight(.bold)
                            .foregroundColor(AppTheme.primary)
                    }
                    .font(.system(size: 14))
                    .padding(.top, 16)
                }
                .padding(.horizontal, 24)
                
                Spacer()
            }
        }
    }
}

struct SocialButton: View {
    let title: String
    let icon: String
    let color: Color
    
    var body: some View {
        Button(action: {}) {
            HStack {
                Image(systemName: icon)
                    .font(.system(size: 20))
                Text(title)
                    .font(.system(size: 16, weight: .semibold))
            }
            .frame(maxWidth: .infinity)
            .frame(height: 56)
            .background(color)
            .foregroundColor(AppTheme.primary)
            .cornerRadius(28)
        }
    }
}

#Preview {
    LoginView()
}
