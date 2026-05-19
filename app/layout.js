import './globals.css'

export const metadata = {
  title: 'Manual of Me',
  description: 'Create your personal operating manual and help your team understand how you work.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
