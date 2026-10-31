/** A command from upstream's item context menu. */
export interface MenuCommand {
    name?: string;
    id?: string;
    icon?: string;
    divider?: boolean;
}

/** Adds a React key to each command. Dividers have no id, so they're numbered in order. */
export const withMenuKeys = (commands: MenuCommand[]) => {
    let dividerCount = 0;
    return commands.map(cmd => ({ ...cmd, key: cmd.id ?? `divider-${++dividerCount}` }));
};
