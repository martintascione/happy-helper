import SwiftUI

struct LandingView: View {
    var body: some View {
        ZStack {
            AppTheme.background.ignoresSafeArea()
            
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 0) {
                    // Header
                    HStack(spacing: 12) {
                        ZStack {
                            RoundedRectangle(cornerRadius: 14)
                                .fill(AppTheme.primary)
                                .frame(width: 40, height: 40)
                            
                            Image(systemName: "house.fill")
                                .foregroundColor(.white)
                                .font(.system(size: 18, weight: .semibold))
                        }
                        
                        Text("Tower")
                            .font(.system(size: 24, weight: .bold))
                            .foregroundColor(AppTheme.primary)
                    }
                    .padding(.horizontal, 24)
                    .padding(.top, 32)
                    
                    // Hero Section
                    VStack(alignment: .leading, spacing: 40) {
                        VStack(alignment: .leading, spacing: 16) {
                            Text("La app de\ntu edificio.")
                                .font(.system(size: 40, weight: .bold))
                                .lineLimit(2)
                                .foregroundColor(AppTheme.primary)
                            
                            Text("Cocheras, comunicados, chat y reportes entre vecinos. Todo en un solo lugar.")
                                .font(.system(size: 17, weight: .medium))
                                .foregroundColor(.secondary)
                                .frame(maxWidth: 300, alignment: .leading)
                        }
                        
                        VStack(spacing: 12) {
                            Button(action: {}) {
                                HStack {
                                    Text("Ingresar")
                                    Spacer()
                                    Image(systemName: "arrow.right")
                                }
                                .padding(.horizontal, 28)
                                .frame(height: 56)
                                .background(AppTheme.primary)
                                .foregroundColor(.white)
                                .font(.system(size: 16, weight: .semibold))
                                .cornerRadius(28)
                            }
                            
                            Button(action: {}) {
                                Text("Crear cuenta")
                                    .frame(maxWidth: .infinity)
                                    .frame(height: 56)
                                    .background(Color.white)
                                    .foregroundColor(AppTheme.primary)
                                    .font(.system(size: 16, weight: .semibold))
                                    .cornerRadius(28)
                                    .shadow(color: Color.black.opacity(0.05), radius: 10, x: 0, y: 5)
                            }
                        }
                    }
                    .padding(.horizontal, 24)
                    .padding(.top, 40)
                    .padding(.bottom, 48)
                    
                    // Features
                    VStack(spacing: 12) {
                        FeatureRow(
                            icon: "car.fill",
                            iconColor: Color.green,
                            bgColor: Color.green.opacity(0.1),
                            title: "Cocheras entre vecinos",
                            description: "Publicá tu cochera cuando no la uses, o alquilá la de un vecino por día."
                        )
                        
                        FeatureRow(
                            icon: "message.fill",
                            iconColor: Color.purple,
                            bgColor: Color.purple.opacity(0.1),
                            title: "Comunicación sin caos",
                            description: "Comunicados oficiales y muro de avisos, sin depender de grupos de WhatsApp."
                        )
                        
                        FeatureRow(
                            icon: "exclamationmark.triangle.fill",
                            iconColor: Color.blue,
                            bgColor: Color.blue.opacity(0.1),
                            title: "Reportes que se resuelven",
                            description: "Reportá un problema y seguí su estado hasta que esté solucionado."
                        )
                    }
                    .padding(.horizontal, 24)
                    
                    // Footer
                    Text("Comunidad Tower · 2026")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.secondary)
                        .opacity(0.6)
                        .frame(maxWidth: .infinity)
                        .padding(.top, 48)
                        .padding(.bottom, 32)
                }
            }
        }
    }
}

struct FeatureRow: View {
    let icon: String
    let iconColor: Color
    let bgColor: Color
    let title: String
    let description: String
    
    var body: some View {
        HStack(alignment: .top, spacing: 16) {
            ZStack {
                Circle()
                    .fill(Color.white)
                    .frame(width: 44, height: 44)
                    .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
                
                Image(systemName: icon)
                    .foregroundColor(iconColor)
                    .font(.system(size: 18))
            }
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(AppTheme.primary)
                
                Text(description)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(.top, 4)
        }
        .padding(20)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(bgColor)
        .cornerRadius(24)
    }
}

#Preview {
    LandingView()
}
