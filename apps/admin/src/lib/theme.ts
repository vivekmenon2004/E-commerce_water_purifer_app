/**
 * Calinfco Water Purifiers - Admin Design System & Brand Tokens
 */

export const brandTokens = {
  name: 'Calinfco Admin Operations',
  tagline: 'Water Purifier E-Commerce & Service Command Center',
  colors: {
    primary: '#0077B6',       // Calinfco Pure Blue
    primaryDark: '#023E8A',   // Deep Ocean
    primaryLight: '#00B4D8',  // Cyan Flow
    accent: '#0096C7',
    waterTint: '#F0F9FF',
    marineDark: '#0B132B',

    // Status & Water Quality Indicators
    optimalTds: '#10B981',    // TDS 50-150 (Pristine / Healthy)
    acceptableTds: '#3B82F6', // TDS 150-300 (Normal)
    warningTds: '#F59E0B',    // TDS 300-500 (Filter replacement due)
    criticalTds: '#EF4444',   // TDS > 500 (Critical alert / service needed)
  },
  navigation: [
    { name: 'Dashboard', href: '/', icon: 'LayoutDashboard' },
    { name: 'Purifiers & Catalog', href: '/purifiers', icon: 'Package' },
    { name: 'Orders & Deliveries', href: '/orders', icon: 'ShoppingCart' },
    { name: 'Service & Maintenance', href: '/services', icon: 'Wrench' },
    { name: 'Customers & AMC', href: '/customers', icon: 'Users' },
  ],
};
