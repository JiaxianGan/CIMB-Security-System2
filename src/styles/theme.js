export const theme = {
  colors: {
    gradients: {
      primary: 'from-blue-500 to-purple-600',
      secondary: 'from-gray-500 to-gray-600', 
      success: 'from-green-500 to-emerald-600',
      danger: 'from-red-500 to-pink-600',
      warning: 'from-yellow-500 to-orange-600',
      info: 'from-cyan-500 to-blue-600',
      purple: 'from-purple-500 to-indigo-600',
      teal: 'from-teal-500 to-cyan-600'
    },
    severity: {
      high: {
        bg: 'from-red-500/20 to-red-600/10',
        border: 'border-red-500/30',
        text: 'text-red-200',
        icon: 'text-red-400'
      },
      medium: {
        bg: 'from-yellow-500/20 to-yellow-600/10',
        border: 'border-yellow-500/30',
        text: 'text-yellow-200',
        icon: 'text-yellow-400'
      },
      low: {
        bg: 'from-blue-500/20 to-blue-600/10',
        border: 'border-blue-500/30',
        text: 'text-blue-200',
        icon: 'text-blue-400'
      }
    }
  },
  effects: {
    glassmorphism: 'backdrop-blur-xl bg-white/10 border border-white/20',
    glow: 'hover:shadow-[0_0_40px_rgba(59,130,246,0.15)]',
    cardShadow: 'shadow-[0_8px_32px_rgba(0,0,0,0.12)]',
    hoverShadow: 'hover:shadow-[0_12px_40px_rgba(0,0,0,0.16)]',
    transition: 'transition-all duration-300'
  },
  spacing: {
    cardPadding: 'p-6',
    sectionSpacing: 'space-y-6'
  }
};

export default theme;