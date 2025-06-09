#!/bin/bash

# Script de gestion Docker pour le projet blog
set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions utilitaires
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Fonction d'aide
show_help() {
    echo "Usage: ./docker-dev.sh [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  up          Démarrer tous les services"
    echo "  down        Arrêter tous les services"
    echo "  rebuild     Reconstruire et redémarrer tous les services"
    echo "  logs        Afficher les logs de tous les services"
    echo "  logs-f      Suivre les logs en temps réel"
    echo "  status      Afficher l'état des services"
    echo "  clean       Nettoyer les images et volumes non utilisés"
    echo "  reset       Réinitialiser complètement (ATTENTION: supprime les données)"
    echo "  health      Vérifier la santé des services"
    echo "  shell-db    Ouvrir un shell dans la base de données"
    echo "  shell-api   Ouvrir un shell dans le backend"
    echo "  help        Afficher cette aide"
}

# Vérifier si Docker est installé
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker n'est pas installé"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose n'est pas installé"
        exit 1
    fi
}

# Démarrer les services
start_services() {
    print_info "Démarrage des services..."
    docker-compose up -d
    print_success "Services démarrés"
    
    print_info "Attente de la disponibilité des services..."
    sleep 10
    
    show_status
}

# Arrêter les services
stop_services() {
    print_info "Arrêt des services..."
    docker-compose down
    print_success "Services arrêtés"
}

# Reconstruire les services
rebuild_services() {
    print_info "Reconstruction des services..."
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    print_success "Services reconstruits et redémarrés"
    
    sleep 10
    show_status
}

# Afficher les logs
show_logs() {
    if [ "$1" = "-f" ]; then
        docker-compose logs -f
    else
        docker-compose logs --tail=50
    fi
}

# Afficher le statut des services
show_status() {
    print_info "État des services:"
    docker-compose ps
    echo ""
    
    print_info "Santé des services:"
    docker-compose exec -T database pg_isready -U postgres && print_success "Database: OK" || print_error "Database: KO"
    
    # Test du backend
    if curl -f -s http://localhost:3001/health > /dev/null 2>&1; then
        print_success "Backend: OK"
    else
        print_error "Backend: KO"
    fi
    
    # Test du frontend
    if curl -f -s http://localhost:80 > /dev/null 2>&1; then
        print_success "Frontend: OK"
    else
        print_error "Frontend: KO"
    fi
}

# Nettoyer Docker
clean_docker() {
    print_info "Nettoyage des ressources Docker inutilisées..."
    docker system prune -f
    docker volume prune -f
    print_success "Nettoyage terminé"
}

# Réinitialiser complètement
reset_all() {
    print_warning "ATTENTION: Cette action va supprimer tous les conteneurs, images et données!"
    read -p "Êtes-vous sûr ? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Réinitialisation complète..."
        docker-compose down -v --rmi all
        docker system prune -af --volumes
        print_success "Réinitialisation terminée"
    else
        print_info "Opération annulée"
    fi
}

# Vérifier la santé des services
check_health() {
    print_info "Vérification de la santé des services..."
    
    # Vérifier les healthchecks Docker
    for service in database backend frontend; do
        health=$(docker-compose ps -q $service | xargs docker inspect --format='{{.State.Health.Status}}' 2>/dev/null || echo "unknown")
        if [ "$health" = "healthy" ]; then
            print_success "$service: healthy"
        elif [ "$health" = "starting" ]; then
            print_warning "$service: starting..."
        else
            print_error "$service: unhealthy"
        fi
    done
}

# Ouvrir un shell dans la base de données
shell_database() {
    print_info "Ouverture d'un shell dans la base de données..."
    docker-compose exec database psql -U postgres -d devsecops_blog
}

# Ouvrir un shell dans le backend
shell_backend() {
    print_info "Ouverture d'un shell dans le backend..."
    docker-compose exec backend sh
}

# Programme principal
main() {
    check_docker
    
    case ${1:-help} in
        up)
            start_services
            ;;
        down)
            stop_services
            ;;
        rebuild)
            rebuild_services
            ;;
        logs)
            show_logs
            ;;
        logs-f)
            show_logs -f
            ;;
        status)
            show_status
            ;;
        clean)
            clean_docker
            ;;
        reset)
            reset_all
            ;;
        health)
            check_health
            ;;
        shell-db)
            shell_database
            ;;
        shell-api)
            shell_backend
            ;;
        help)
            show_help
            ;;
        *)
            print_error "Commande inconnue: $1"
            show_help
            exit 1
            ;;
    esac
}

main "$@"