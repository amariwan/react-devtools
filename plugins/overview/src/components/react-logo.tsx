export function ReactLogo({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			role="img"
			aria-label="React logo"
		>
			<title>React logo</title>
			<circle cx="12" cy="12" r="2" fill="#61DAFB" />
			<g stroke="#61DAFB" strokeWidth="1" fill="none">
				<ellipse cx="12" cy="12" rx="11" ry="4.2" />
				<ellipse
					cx="12"
					cy="12"
					rx="11"
					ry="4.2"
					transform="rotate(60 12 12)"
				/>
				<ellipse
					cx="12"
					cy="12"
					rx="11"
					ry="4.2"
					transform="rotate(120 12 12)"
				/>
			</g>
		</svg>
	);
}
