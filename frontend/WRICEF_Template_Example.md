# WRICEF Excel Template Guide

## Overview
This document explains how to structure your WRICEF Excel file for import into the SAP Performance Management Platform.

## File Format
- **Supported formats:** `.xlsx`, `.xls`
- **Required sheets:** At least one sheet (preferably named "Objects" or "Tickets")

## Sheet 1: Objects (Recommended)

### Required Columns:
| Column Name | Aliases | Description | Example |
|------------|---------|-------------|---------|
| ID | `id`, `object id`, `objet id`, `object`, `objet`, `wricef object id` | Unique identifier for the WRICEF object | `OBJ-001`, `W-FI-001` |
| Title | `title`, `titre`, `object title`, `objet title` | Name/title of the object | `Customer Master Data Migration` |
| Description | `description`, `desc` | Detailed description | `Migration of customer master data from legacy system` |
| Complexity | `complexity`, `complexite`, `complexite objet` | Complexity level | `SIMPLE`, `MOYEN`, `COMPLEXE`, `TRES_COMPLEXE` |
| Tickets | `tickets`, `ticket`, `ticket titles`, `liste tickets`, `liste des tickets`, `ticket list` | Inline list of ticket titles (separated by newline, pipe, semicolon, or comma) | `Ticket 1\|Ticket 2\|Ticket 3` |

### Example Data:

```
ID          | Title                              | Description                                    | Complexity      | Tickets
OBJ-001     | Customer Master Migration          | Migrate customer data from SAP ECC to S/4HANA | COMPLEXE        | Data Extraction|Data Transformation|Data Load|Validation
OBJ-002     | Invoice Report Enhancement         | Add new fields to invoice report               | MOYEN           | Design Report|Develop ABAP|Unit Testing
OBJ-003     | Workflow Approval Process          | Implement multi-level approval workflow        | TRES_COMPLEXE   | Workflow Design|Configuration|Testing|Deployment
```

## Sheet 2: Tickets (Optional - for detailed ticket information)

### Required Columns:
| Column Name | Aliases | Description | Example |
|------------|---------|-------------|---------|
| Object ID | `object id`, `objet id`, `object`, `objet`, `wricef object id` | Reference to parent object | `OBJ-001` |
| Ticket ID | `ticket id`, `id` | Unique ticket identifier (optional, auto-generated if empty) | `TK-001` |
| Title | `title`, `ticket title`, `titre` | Ticket title | `Data Extraction Module` |
| Description | `description`, `desc` | Ticket description | `Extract customer data from legacy tables` |
| Priority | `priority`, `priorite` | Priority level | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| Status | `status`, `statut` | Current status | `NEW`, `IN_PROGRESS`, `IN_TEST`, `BLOCKED`, `DONE`, `REJECTED` |

### Example Data:

```
Object ID | Ticket ID | Title                    | Description                              | Priority | Status
OBJ-001   | TK-001    | Data Extraction          | Extract customer data from legacy tables | HIGH     | IN_PROGRESS
OBJ-001   | TK-002    | Data Transformation      | Transform data to S/4HANA format        | HIGH     | NEW
OBJ-001   | TK-003    | Data Load                | Load transformed data into S/4HANA      | MEDIUM   | NEW
OBJ-002   | TK-004    | Design Report            | Create report design document           | MEDIUM   | DONE
OBJ-002   | TK-005    | Develop ABAP             | Implement ABAP code for report          | HIGH     | IN_PROGRESS
```

## Import Behavior

### Two-Sheet Structure (Recommended):
1. **Objects sheet:** Defines WRICEF objects with basic info
2. **Tickets sheet:** Provides detailed ticket information linked to objects

### Single-Sheet Structure:
- If only one sheet exists, it will be treated as the Objects sheet
- Tickets can be listed inline in the "Tickets" column (separated by `|`, `;`, `,`, or newlines)

### Auto-Generation:
- **Object IDs:** If missing, auto-generated as `OBJ-001`, `OBJ-002`, etc.
- **Ticket IDs:** If missing, auto-generated as `{OBJECT_ID}-TK-001`, `{OBJECT_ID}-TK-002`, etc.

## Complexity Mapping

The system recognizes these complexity values (case-insensitive):

| Input Values | Mapped To |
|-------------|-----------|
| `simple`, `low`, `faible` | `SIMPLE` |
| `moyen`, `medium` | `MOYEN` |
| `complexe`, `complex`, `high` | `COMPLEXE` |
| `tres complexe`, `very complex`, `critical` | `TRES_COMPLEXE` |

## Priority Mapping

| Input Values | Mapped To |
|-------------|-----------|
| `low` | `LOW` |
| `medium`, `moyen` | `MEDIUM` |
| `high` | `HIGH` |
| `critical`, `urgent` | `CRITICAL` |

## Status Mapping

| Input Values | Mapped To |
|-------------|-----------|
| `new`, `nouveau` | `NEW` |
| `in progress`, `en cours` | `IN_PROGRESS` |
| `in test`, `test` | `IN_TEST` |
| `blocked`, `bloque` | `BLOCKED` |
| `done`, `termine` | `DONE` |
| `rejected`, `rejete` | `REJECTED` |

## Example Complete WRICEF File Structure

### Sheet: Objects
```
ID      | Title                        | Description                           | Complexity      | Tickets
W-001   | Customer Master Migration    | Migrate customer master data          | COMPLEXE        | Extract Data|Transform Data|Load Data
W-002   | Invoice Report               | New invoice report with analytics     | MOYEN           | Design|Development|Testing
W-003   | Approval Workflow            | Multi-level approval process          | TRES_COMPLEXE   |
```

### Sheet: Tickets
```
Object ID | Ticket ID | Title              | Description                    | Priority | Status
W-001     | W-001-T1  | Extract Data       | Extract from legacy system     | HIGH     | DONE
W-001     | W-001-T2  | Transform Data     | Apply transformation rules     | HIGH     | IN_PROGRESS
W-001     | W-001-T3  | Load Data          | Load into S/4HANA             | MEDIUM   | NEW
W-002     | W-002-T1  | Design             | Create report design          | MEDIUM   | DONE
W-002     | W-002-T2  | Development        | Implement ABAP code           | HIGH     | IN_PROGRESS
W-002     | W-002-T3  | Testing            | Unit and integration tests    | MEDIUM   | NEW
W-003     | W-003-T1  | Workflow Config    | Configure workflow steps      | HIGH     | NEW
W-003     | W-003-T2  | Approval Rules     | Define approval rules         | HIGH     | NEW
```

## Usage in Application

1. **Create/Edit Project:** Navigate to Projects page
2. **Click "Create Project" or "Edit" button**
3. **Fill in project details** (Name, Type, Status, etc.)
4. **Upload WRICEF:** Click "Upload Excel" in the WRICEF section
5. **Select your Excel file** with the structure above
6. **Review imported data:** The system will show object and ticket counts
7. **Save project:** Click "Create Project" or "Save Changes"
8. **View WRICEF:** Go to project details → WRICEF tab to browse objects and tickets

## Tips

- Use consistent naming conventions for Object IDs (e.g., `W-FI-001`, `W-MM-001`)
- Keep ticket titles concise and descriptive
- Use the Tickets sheet for detailed information
- Test with a small file first (2-3 objects) before importing large datasets
- The parser is flexible with column names (supports French and English)
- Empty rows are automatically skipped

## Error Handling

If import fails, check:
- File format is `.xlsx` or `.xls`
- At least one sheet exists
- Required columns are present (ID or Title for objects)
- No special characters in sheet names
- File is not corrupted or password-protected
