#!/usr/bin/env bash
# Rendert die PlantUML-Diagramme der Dokumentation als PNG.
# Aufruf:  ./scripts/generate-diagrams.sh [datei.plantuml ...]
# Ohne Argumente werden alle Quellen unter docs/spec/diagrams/ und
# docs/arch/diagrams/ in das jeweilige Nachbarverzeichnis diagrams-png/
# gerendert. Voraussetzung: Java 8 oder neuer.

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIAGRAM_ROOTS=(
    "$PROJECT_ROOT/docs/spec/diagrams"
    "$PROJECT_ROOT/docs/arch/diagrams"
)
PLANTUML_JAR="$PROJECT_ROOT/scripts/plantuml.jar"
PLANTUML_VERSION="1.2025.2"
PLANTUML_URL="https://github.com/plantuml/plantuml/releases/download/v${PLANTUML_VERSION}/plantuml-${PLANTUML_VERSION}.jar"

if [[ ! -f "$PLANTUML_JAR" ]]; then
    echo "Lade PlantUML ${PLANTUML_VERSION} herunter ..."
    curl -fsSL -o "$PLANTUML_JAR" "$PLANTUML_URL"
fi

if [[ $# -gt 0 ]]; then
    files=("$@")
else
    files=()
    for root in "${DIAGRAM_ROOTS[@]}"; do
        [[ -d "$root" ]] || continue
        for f in "$root"/*.plantuml; do
            [[ -f "$f" ]] && files+=("$f")
        done
    done
fi

for f in "${files[@]}"; do
    out_dir="$(dirname "$f")-png"
    mkdir -p "$out_dir"
    abs_out_dir="$(cd "$out_dir" && pwd)"
    echo "Rendere $(basename "$f") -> $abs_out_dir"
    java -Djava.awt.headless=true -jar "$PLANTUML_JAR" -charset UTF-8 -tpng -o "$abs_out_dir" "$f"
done
