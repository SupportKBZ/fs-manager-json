#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';

interface FileStructure {
    [key: string]: string | FileStructure;
}

function moveExistingFiles(structure: FileStructure, currentPath: string, rootPath: string): void {
    for (const [name, content] of Object.entries(structure)) {
        const fullPath = path.join(currentPath, name);
        const rootFilePath = path.join(rootPath, name);

        if (typeof content === 'string') {
            // Vérifier si le fichier existe à la racine
            if (fs.existsSync(rootFilePath)) {
                // Créer le dossier parent s'il n'existe pas
                const parentDir = path.dirname(fullPath);
                if (!fs.existsSync(parentDir)) {
                    fs.mkdirSync(parentDir, { recursive: true });
                }
                // Déplacer le fichier
                fs.renameSync(rootFilePath, fullPath);
            }
        } else {
            // C'est un dossier, on continue la recherche récursive
            moveExistingFiles(content, fullPath, rootPath);
        }
    }
}

function moveAllFilesToRoot(destinationPath: string): void {
    if (!fs.existsSync(destinationPath)) {
        return;
    }

    const filesToMove: { source: string; dest: string }[] = [];
    const dirsToRemove: string[] = [];

    function collectFiles(dir: string): void {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stats = fs.statSync(fullPath);
            
            if (stats.isDirectory()) {
                collectFiles(fullPath);
                dirsToRemove.push(fullPath);
            } else {
                filesToMove.push({
                    source: fullPath,
                    dest: path.join(destinationPath, file)
                });
            }
        }
    }

    collectFiles(destinationPath);

    // Déplacer tous les fichiers
    for (const { source, dest } of filesToMove) {
        fs.renameSync(source, dest);
    }

    // Supprimer tous les dossiers vides
    for (const dir of dirsToRemove.sort((a, b) => b.length - a.length)) {
        try {
            fs.rmdirSync(dir);
        } catch (error) {
            // Ignorer les erreurs si le dossier n'est pas vide
        }
    }
}

function createStructure(jsonPath: string, destinationPath: string): void {
    try {
        // Vérifier si le fichier JSON existe
        if (!fs.existsSync(jsonPath)) {
            console.error(`Le fichier JSON ${jsonPath} n'existe pas.`);
            process.exit(1);
        }

        // Vérifier si le chemin pointe vers un dossier
        const stats = fs.statSync(jsonPath);
        if (stats.isDirectory()) {
            console.error(`Le chemin ${jsonPath} pointe vers un dossier, pas un fichier JSON.`);
            process.exit(1);
        }

        // Vérifier si le dossier de destination existe
        if (!fs.existsSync(destinationPath)) {
            fs.mkdirSync(destinationPath, { recursive: true });
        }

        // Ramener tous les fichiers à la racine
        moveAllFilesToRoot(destinationPath);

        // Lire le fichier JSON
        const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
        const structure: FileStructure = JSON.parse(jsonContent);

        // Déplacer les fichiers existants selon la structure
        moveExistingFiles(structure, destinationPath, destinationPath);

        // Créer la structure
        createFilesAndFolders(structure, destinationPath);

        console.log('Structure créée avec succès !');
    } catch (error) {
        console.error('Une erreur est survenue:', error);
        process.exit(1);
    }
}

function createFilesAndFolders(structure: FileStructure, currentPath: string): void {
    for (const [name, content] of Object.entries(structure)) {
        const fullPath = path.join(currentPath, name);

        if (typeof content === 'string') {
            // C'est un fichier
            if (!fs.existsSync(fullPath)) {
                fs.writeFileSync(fullPath, content);
            }
        } else {
            // C'est un dossier
            if (!fs.existsSync(fullPath)) {
                fs.mkdirSync(fullPath);
            }
            createFilesAndFolders(content, fullPath);
        }
    }
}

function exportStructure(sourcePath: string, jsonPath: string): void {
    try {
        if (!fs.existsSync(sourcePath)) {
            console.error(`Le dossier source ${sourcePath} n'existe pas.`);
            process.exit(1);
        }

        const structure: FileStructure = {};

        function buildStructure(currentPath: string, currentStructure: FileStructure): void {
            const files = fs.readdirSync(currentPath);
            
            for (const file of files) {
                const fullPath = path.join(currentPath, file);
                const stats = fs.statSync(fullPath);
                
                if (stats.isDirectory()) {
                    currentStructure[file] = {};
                    buildStructure(fullPath, currentStructure[file] as FileStructure);
                } else {
                    currentStructure[file] = '';
                }
            }
        }

        buildStructure(sourcePath, structure);
        
        // Écrire la structure dans le fichier JSON
        fs.writeFileSync(jsonPath, JSON.stringify(structure, null, 2));
        console.log(`Structure exportée avec succès vers ${jsonPath} !`);
    } catch (error) {
        console.error('Une erreur est survenue lors de l\'export:', error);
        process.exit(1);
    }
}

// Récupérer les arguments de la ligne de commande
const args = process.argv.slice(2);
if (args.length < 2) {
    console.error('Usage: fs-manager-json <commande> <chemin_source> <chemin_destination>');
    console.error('Commandes disponibles:');
    console.error('  create <chemin_vers_json> <dossier_destination> - Crée une structure à partir d\'un JSON');
    console.error('  export <dossier_source> <chemin_vers_json> - Exporte une structure vers un JSON');
    process.exit(1);
}

const [command, sourcePath, destinationPath] = args;

if (command === 'create') {
    if (args.length !== 3) {
        console.error('Usage: fs-manager-json create <chemin_vers_json> <dossier_destination>');
        process.exit(1);
    }
    createStructure(sourcePath, destinationPath);
} else if (command === 'export') {
    if (args.length !== 3) {
        console.error('Usage: fs-manager-json export <dossier_source> <chemin_vers_json>');
        process.exit(1);
    }
    exportStructure(sourcePath, destinationPath);
} else {
    console.error('Commande non reconnue. Utilisez "create" ou "export".');
    process.exit(1);
}
