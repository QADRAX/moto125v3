import { FileItem } from "./types";
import fs from 'fs-extra';
import path from 'path';
import mime from 'mime-types';

export async function traverseDirectories(
    dirPath: string,
    currentPath: string = '',
    filesList: FileItem[] = []
): Promise<FileItem[]> {
    const files = await fs.readdir(dirPath);

    for (const file of files) {
        const filePath = path.join(dirPath, file);
        const fileStat = await fs.stat(filePath);

        if (fileStat.isDirectory()) {
            await traverseDirectories(filePath, path.join(currentPath, file), filesList);
        } else if (isImage(filePath)) {
            const contentType = mime.lookup(filePath);
            if(contentType) {
                filesList.push({
                    filePath,
                    folderPath: currentPath,
                    fileName: file,
                    contentType
                });
            }
        }
    }

    return filesList;
}

function isImage(filePath: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg'];
    return imageExtensions.includes(path.extname(filePath).toLowerCase());
}