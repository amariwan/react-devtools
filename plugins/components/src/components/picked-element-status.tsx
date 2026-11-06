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
		<div className="devtools:text-[11px] devtools:text-muted-foreground">
			Picked {tag}
			{sourceOrigin ? ` · source: ${sourceOrigin}` : ""}
			{sourceRole ? ` · ${sourceRole}` : ""}
		</div>
	);
}
