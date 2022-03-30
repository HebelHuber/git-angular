import * as vscode from 'vscode';
import { decode, encode } from './encoding';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { NoteItemProvider } from './NoteItemProvider';

export class NoteItem extends vscode.TreeItem {
    children: NoteItem[] | undefined;
    content: string | undefined;
    fullPath: string;
    command?: vscode.Command | undefined;
    owner: NoteItemProvider;
    iconPath?: string | vscode.Uri | { light: string | vscode.Uri; dark: string | vscode.Uri } | vscode.ThemeIcon | undefined;
    isFolder = true;
    hasChildren = false;
    isEmptyFolder = false;
    hasSubFolders = false;


    constructor(label: string, fullPath: string, owner: NoteItemProvider, content?: string, children?: NoteItem[]) {
        super(label, children === undefined ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed);
        this.children = children;
        this.content = content;
        this.fullPath = fullPath;
        this.owner = owner;

        this.updateItemState();
    }

    updateItemState(): void {

        this.isFolder = this.children !== undefined;
        this.hasChildren = this.children !== undefined && this.children.length > 0;
        this.isEmptyFolder = this.isFolder && !this.hasChildren;
        this.hasSubFolders = this.children !== undefined && this.children.filter(child => child.isFolder).length > 0;
        this.contextValue = this.isFolder ? 'folder' : 'note';
        this.iconPath = this.isFolder ? vscode.ThemeIcon.Folder : vscode.ThemeIcon.File;

        this.collapsibleState = this.isFolder ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None;

        this.command = this.isFolder ? undefined : {
            title: "Show Node",
            command: "syncedNotes.showNote",
            arguments: [this]
        };
    }

    // getTooltip(): string {
    //     return this.label as string;
    // }

    addChild(child: NoteItem): void {
        if (this.children === undefined)
            this.children = [];

        this.children.push(child);
        this.updateItemState();
    }

    getTempFileName(): string {
        return this.label as string + ".md";
        // return this.fullPath.replace(/\//g, '_');
    }

    getChildren(includeNotes: boolean, includeFolders: boolean, includeEmptyFolders: boolean): NoteItem[] {
        if (this.children === undefined)
            return [];

        if (includeNotes && includeFolders && includeEmptyFolders)
            return this.children;
        if (includeNotes && includeFolders && !includeEmptyFolders)
            return this.children.filter(child => !child.isEmptyFolder);

        if (includeNotes && !includeFolders && includeEmptyFolders)
            return this.children.filter(child => !child.isFolder);
        if (includeNotes && !includeFolders && !includeEmptyFolders)
            return this.children.filter(child => !child.isFolder && !child.isEmptyFolder);

        if (!includeNotes && includeFolders && includeEmptyFolders)
            return this.children.filter(child => child.isFolder);
        if (!includeNotes && includeFolders && !includeEmptyFolders)
            return this.children.filter(child => child.isFolder && !child.isEmptyFolder);

        return [];
    }

    containsTextNoteRecursive(): boolean {

        if (!this.isFolder)
            return true;

        if (this.isFolder && this.children !== undefined) {

            for (let i = 0; i < this.children.length; i++) {
                if (this.children[i].containsTextNoteRecursive())
                    return true;
            }
        }

        return false;
    }

    getJson(): string {

        // I'm a folder
        if (this.isFolder)
            return `{"${this.label}":[${this.children?.map(child => child.getJson()).join(',')}]}`;

        // I'm a leaf
        return `{"${this.label}" : "${this.content}"}`;
    }

    // getChildrenRecursive(includeNotes: boolean, includeFolders: boolean, includeEmptyFolders: boolean): NoteItem[] {

    //     let children = this.getChildren(includeNotes, includeFolders, includeEmptyFolders);
    //     children.forEach(child => {
    //         children = children.concat(child.getChildrenRecursive(includeNotes, includeFolders, includeEmptyFolders));
    //     });
    //     return children;
    // }

    async decodedContent(truncateTo?: number): Promise<string> {
        const decoded = await decode(this.content as string);

        if (truncateTo)
            return decoded.substr(0, truncateTo) + '...';

        return decoded
    }

    async writeToTempFile(logger: vscode.OutputChannel): Promise<vscode.Uri> {
        const tempFilePath = path.join(os.tmpdir(), this.getTempFileName());
        logger.appendLine(`temp file: ${tempFilePath}`);

        await fs.writeFile(tempFilePath, await this.decodedContent(), (err) => {
            if (err) logger.appendLine(`Error writing file: ${tempFilePath}, ${err}`);
        });

        return vscode.Uri.file(tempFilePath);
    }

    async showPreview(logger: vscode.OutputChannel): Promise<void> {

        this.writeToTempFile(logger).then(async uri => {
            vscode.commands.executeCommand("markdown.showPreview", uri);
        });
    }

    async openEditor(logger: vscode.OutputChannel): Promise<void> {
        logger.appendLine(`editing note ${this.label}`);

        this.writeToTempFile(logger).then(async uri => {
            await vscode.commands.executeCommand('vscode.open', uri);
            // await vscode.commands.executeCommand('cursorBottom');

            const onSaveDisposable = vscode.workspace.onDidSaveTextDocument(async textDocument => {
                if (textDocument.uri.fsPath === uri.fsPath) {
                    await this.saveNote(textDocument, logger);
                }
            });

            const onCloseDisposable = vscode.workspace.onDidCloseTextDocument(async textDocument => {
                if (textDocument.uri.fsPath === uri.fsPath) {
                    onSaveDisposable.dispose();
                    onCloseDisposable.dispose();
                    await fs.unlink(uri.fsPath, (err) => {
                        if (err) logger.appendLine(`Error deleting file: ${uri.fsPath}, ${err}`);
                    });
                }
            });
        });
    }

    async saveNote(textDocument: vscode.TextDocument, logger: vscode.OutputChannel): Promise<void> {
        logger.appendLine(`saving note ${this.label}`);
        const content = await textDocument.getText();
        this.content = await encode(content, logger);
        this.owner.saveToConfig();
    }
}