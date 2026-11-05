type PickedElementStatusProps = {
	tag: string | null;
	sourceOrigin: string | null;
	sourceRole: string | null;
};

export function PickedElementStatus({
	tag,
	sourceOrigin,
	sourceRole,
}: PickedElementStatusProps) {
	if (!tag) return null;
	return (
		<div style={{ fontSize: 11, color: "var(--muted-foreground, #71717a)" }}>
			Picked {tag}
			{sourceOrigin ? ` · source: ${sourceOrigin}` : ""}
			{sourceRole ? ` · ${sourceRole}` : ""}
		</div>
	);
}
