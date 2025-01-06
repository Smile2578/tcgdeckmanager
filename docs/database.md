Documentation Base de Données - Pokémon TCG
Dernière mise à jour: 06/01/2025
Schéma Principal
Tables Core
mermaidCopyerDiagram
    CARDS ||--o{ PRICE_HISTORY : has
    CARDS ||--o{ PREDICTIONS : has
    SETS ||--o{ CARDS : contains

    CARDS {
        uuid id PK
        string name
        string number
        uuid set_id FK
        string rarity
        jsonb variants
        timestamp created_at
        timestamp updated_at
    }

    PRICE_HISTORY {
        uuid id PK
        uuid card_id FK
        decimal price
        timestamp recorded_at
        string source
    }

    SETS {
        uuid id PK
        string name
        date release_date
        int total_cards
    }
Indexation
Index Primaires
sqlCopy-- Performance Critique
CREATE INDEX idx_cards_lookup ON cards(name, set_id);
CREATE INDEX idx_price_history ON price_history(card_id, recorded_at);
CREATE INDEX idx_sets_date ON sets(release_date);
Flow de Données
Ingestion
yamlCopysources:
  - type: TCG API
    fréquence: quotidienne
    tables: [cards, sets]
  
  - type: Prix
    fréquence: horaire
    tables: [price_history]
Rétention
yamlCopypolitique_rétention:
  price_history:
    durée: 2 ans
    agrégation: 
      - quotidienne: 30 jours
      - hebdomadaire: 1 an
      - mensuelle: 2 ans+
Migrations
Politique
yamlCopymigrations:
  - type: automatique
  - backup: obligatoire
  - fenêtre: 02:00-04:00 UTC
  - rollback: préparé
Performances
Optimisations
yamlCopyrequêtes_critiques:
  - recherche_cartes:
      index: idx_cards_lookup
      cache: 1h
  
  - historique_prix:
      index: idx_price_history
      partition: mensuelle
Sécurité
Accès
yamlCopyroles:
  - read_only:
      tables: [cards, sets]
      
  - analytics:
      tables: [price_history]
      
  - admin:
      all: true
Maintenance
Tâches Régulières
yamlCopydaily:
  - vacuum analyze
  - stats update
  - index repack

weekly:
  - integrity check
  - performance audit
Backups
Stratégie
yamlCopybackup:
  full:
    fréquence: quotidienne
    rétention: 7 jours
  
  incrémental:
    fréquence: horaire
    rétention: 24h

Notes Importantes
Points d'Attention

Pas de suppression de données historiques
Validation avant insertion
Monitoring espace disque
Vérification intégrité données

Bonnes Pratiques

Toujours utiliser les index
Transactions pour modifications
Validation contraintes
Documentation changements


Ce document est mis à jour après chaque modification du schéma