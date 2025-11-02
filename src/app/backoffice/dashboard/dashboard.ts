import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environment';
import { Chart, registerables } from 'chart.js';

// Enregistrer tous les composants Chart.js
Chart.register(...registerables);

interface DashboardStats {
  totalCustomers: number;
  customersTrend: number;
  totalSales: number;
  salesTrend: number;
  totalOrders: number;
  ordersTrend: number;
}

interface TopProduct {
  id: number;
  name: string;
  image: string;
  rating: number;
  sold: number;
  profit: number;
}

interface CustomerStats {
  male: number;
  female: number;
}

interface CustomerGenderStatsResponse {
  male: number;
  female: number;
  other: number;
}

interface DistributionMap {
  africa: number;
  america: number;
  europe: number;
  others: number;
}

interface DistributionStatsResponse {
  africa: number;
  america: number;
  europe: number;
  others: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('salesChart') salesChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('customerChart') customerChartRef!: ElementRef<HTMLCanvasElement>;

  private http = inject(HttpClient);
  private salesChart: Chart | null = null;
  private customerChart: Chart | null = null;

  // Signals pour la réactivité
  selectedPeriod = signal<'1D' | '1M' | '3M' | '1Y'>('1Y');
  isLoading = signal(true);

  // Données du dashboard
  stats: DashboardStats = {
    totalCustomers: 0,
    customersTrend: 0,
    totalSales: 0,
    salesTrend: 0,
    totalOrders: 0,
    ordersTrend: 0
  };

  topProducts: TopProduct[] = [];
  customerStats: CustomerStats = { male: 0, female: 0 };
  distributionMap: DistributionMap = { africa: 0, america: 0, europe: 0, others: 0 };

  // Données pour le graphique des ventes mensuelles
  salesData = {
    labels: ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'],
    data: [25000, 30000, 28000, 35000, 32000, 45000, 38000, 40000, 35000, 42000, 38000, 48000]
  };

  // Exposer Math pour le template
  Math = Math;

  // Périodes disponibles
  periods: Array<'1D' | '1M' | '3M' | '1Y'> = ['1D', '1M', '3M', '1Y'];

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    // Attendre un court instant pour que les canvas soient disponibles
    setTimeout(() => {
      this.initSalesChart();
      // Initialiser le graphique clients même si les données ne sont pas encore chargées
      this.initCustomerChart();
    }, 100);
  }

  /**
   * Charge toutes les données du dashboard
   */
  private loadDashboardData(): void {
    this.isLoading.set(true);

    // Simuler des données (à remplacer par de vrais appels API)
    this.stats = {
      totalCustomers: 45000,
      customersTrend: 7.0,
      totalSales: 45000,
      salesTrend: 7.0,
      totalOrders: 65000,
      ordersTrend: -3.5
    };

    this.topProducts = [
      {
        id: 1,
        name: 'Pneu Michelin Primacy 4',
        image: '/assets/img/logoPneuMali.png',
        rating: 4.7,
        sold: 210,
        profit: 22200
      },
      {
        id: 2,
        name: 'Bridgestone Turanza T005',
        image: '/assets/img/logoPneuMali.png',
        rating: 4.5,
        sold: 185,
        profit: 19500
      },
      {
        id: 3,
        name: 'Continental PremiumContact 6',
        image: '/assets/img/logoPneuMali.png',
        rating: 4.8,
        sold: 165,
        profit: 18300
      }
    ];

    // Les statistiques clients seront chargées depuis l'API
    this.customerStats = { male: 0, female: 0 };
    this.loadCustomerGenderStats();

    // Les statistiques de distribution seront chargées depuis l'API
    this.distributionMap = { africa: 0, america: 0, europe: 0, others: 0 };
    this.loadDistributionStats();

    this.isLoading.set(false);
  }

  /**
   * Initialise le graphique des ventes
   */
  private initSalesChart(): void {
    if (!this.salesChartRef) return;

    const ctx = this.salesChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    // Détruire l'ancien graphique s'il existe
    if (this.salesChart) {
      this.salesChart.destroy();
    }

    this.salesChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.salesData.labels,
        datasets: [{
          label: 'Ventes',
          data: this.salesData.data,
          backgroundColor: '#00d9ff',
          borderRadius: 6,
          barThickness: 30,
          hoverBackgroundColor: '#00f0ff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#1a1a1a',
            padding: 12,
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#00d9ff',
            borderWidth: 1,
            displayColors: false,
            callbacks: {
              label: (context: any) => {
                const value = context.parsed.y ?? 0;
                return `${this.formatCurrency(value)}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: '#9ca3af',
              callback: (value: any) => this.formatCurrency(Number(value))
            },
            grid: {
              color: '#374151'
            }
          },
          x: {
            ticks: {
              color: '#9ca3af'
            },
            grid: {
              display: false
            }
          }
        }
      }
    });
  }

  /**
   * Initialise le graphique en donut des clients
   */
  private initCustomerChart(): void {
    if (!this.customerChartRef) return;

    const ctx = this.customerChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.customerChart) {
      this.customerChart.destroy();
    }

    const total = this.customerStats.male + this.customerStats.female;
    const malePercent = ((this.customerStats.male / total) * 100).toFixed(0);
    const femalePercent = ((this.customerStats.female / total) * 100).toFixed(0);

    this.customerChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Hommes', 'Femmes'],
        datasets: [{
          data: [this.customerStats.male, this.customerStats.female],
          backgroundColor: ['#00d9ff', '#10b981'],
          borderWidth: 2,
          borderColor: '#1a1a1a'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#1a1a1a',
            padding: 12,
            borderColor: '#00d9ff',
            borderWidth: 1,
            titleColor: '#fff',
            bodyColor: '#fff',
            callbacks: {
              label: (context: any) => {
                const label = context.label || '';
                const value = context.parsed;
                const percent = context.dataIndex === 0 ? malePercent : femalePercent;
                return `${label}: ${value} (${percent}%)`;
              }
            }
          }
        }
      }
    });
  }

  /**
   * Change la période sélectionnée
   */
  selectPeriod(period: '1D' | '1M' | '3M' | '1Y'): void {
    this.selectedPeriod.set(period);
    // TODO: Recharger les données selon la période
    this.loadDashboardData();
  }

  /**
   * Calcule le pourcentage pour les clients
   */
  getMalePercent(): number {
    const total = this.customerStats.male + this.customerStats.female;
    return Math.round((this.customerStats.male / total) * 100);
  }

  getFemalePercent(): number {
    const total = this.customerStats.male + this.customerStats.female;
    return Math.round((this.customerStats.female / total) * 100);
  }

  /**
   * Formate un nombre en devise
   */
  formatCurrency(value: number): string {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}k`;
    }
    return `$${value}`;
  }

  /**
   * Formate un grand nombre
   */
  formatNumber(value: number): string {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}.000`;
    }
    return value.toString();
  }

  /**
   * Génère un array pour ngFor
   */
  generateStars(rating: number): boolean[] {
    return Array(5).fill(0).map((_, i) => i < Math.floor(rating));
  }

  /**
   * Charge les statistiques clients par genre depuis l'API
   */
  private loadCustomerGenderStats(): void {
    this.http.get<CustomerGenderStatsResponse>(`${environment.apiUrl}/admin/stats/customers-gender`).subscribe({
      next: (response) => {
        this.customerStats = {
          male: response.male,
          female: response.female
        };
        // Mettre à jour le graphique si déjà initialisé, sinon initialiser
        if (this.customerChart) {
          this.updateCustomerChart();
        } else if (this.customerChartRef) {
          // Si le graphique n'est pas encore initialisé, l'initialiser maintenant avec les vraies données
          setTimeout(() => this.initCustomerChart(), 50);
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement des statistiques clients par genre:', error);
        // Garder les valeurs par défaut en cas d'erreur
      }
    });
  }

  /**
   * Met à jour le graphique des clients avec les nouvelles données
   */
  private updateCustomerChart(): void {
    if (!this.customerChart || !this.customerChartRef) return;

    const total = this.customerStats.male + this.customerStats.female;
    const malePercent = total > 0 ? ((this.customerStats.male / total) * 100).toFixed(0) : '0';
    const femalePercent = total > 0 ? ((this.customerStats.female / total) * 100).toFixed(0) : '0';

    this.customerChart.data.datasets[0].data = [this.customerStats.male, this.customerStats.female];
    this.customerChart.update();
  }

  /**
   * Charge les statistiques de distribution géographique depuis l'API
   */
  private loadDistributionStats(): void {
    this.http.get<DistributionStatsResponse>(`${environment.apiUrl}/admin/stats/distribution`).subscribe({
      next: (response) => {
        this.distributionMap = {
          africa: response.africa,
          america: response.america,
          europe: response.europe,
          others: response.others
        };
      },
      error: (error) => {
        console.error('Erreur lors du chargement des statistiques de distribution:', error);
        // Garder les valeurs par défaut en cas d'erreur
      }
    });
  }
}

