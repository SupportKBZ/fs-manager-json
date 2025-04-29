# fs-manager-json

Un outil en ligne de commande pour gérer et organiser des structures de fichiers à partir de fichiers JSON.

## Installation

```bash
npm install -g fs-manager-json
```

## Utilisation

L'outil propose deux commandes principales :

### Créer une structure à partir d'un JSON

```bash
fs-manager-json create <chemin_vers_json> <dossier_destination>
```

Cette commande va :
1. Lire le fichier JSON spécifié
2. Créer la structure de dossiers et fichiers correspondante dans le dossier de destination
3. Déplacer les fichiers existants selon la structure définie

### Exporter une structure vers un JSON

```bash
fs-manager-json export <dossier_source> <chemin_vers_json>
```

Cette commande va :
1. Analyser la structure du dossier source
2. Générer un fichier JSON représentant cette structure

## Format du fichier JSON

Le fichier JSON doit suivre cette structure :

```json
{
  "dossier1": {
    "sousDossier": {
      "fichier.txt": ""
    },
    "fichier2.txt": ""
  },
  "fichier3.txt": ""
}
```

- Les objets représentent des dossiers
- Les chaînes de caractères représentent des fichiers (la valeur peut être vide)

## Fonctionnalités

- Création de structures de fichiers à partir d'un JSON
- Export de structures de fichiers vers un JSON
- Gestion automatique des fichiers existants
- Création récursive des dossiers
- Support des chemins relatifs et absolus

## Licence

MIT
