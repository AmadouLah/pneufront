import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environement';
import { Chart, registerables } from 'chart.js';
import { ThemeService } from '../../shared/services/theme.service';

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

interface DistributionMap {
  asia: number;
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
  private themeService = inject(ThemeService);
  private salesChart: Chart | null = null;
  private customerChart: Chart | null = null;

  // Signals pour la réactivité
  selectedPeriod = signal<'1D' | '1M' | '3M' | '1Y'>('1Y');
  isLoading = signal(true);

  constructor() {
    // Écouter les changements de thème
    effect(() => {
      const isDark = this.themeService.currentTheme() === 'dark';
      if (this.salesChart || this.customerChart) {
        this.updateChartsTheme(isDark);
      }
    });
  }

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
  distributionMap: DistributionMap = { asia: 0, america: 0, europe: 0, others: 0 };

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
        image: '/img/logoPneuMali.png',
        rating: 4.7,
        sold: 210,
        profit: 22200
      },
      {
        id: 2,
        name: 'Bridgestone Turanza T005',
        image: '/img/logoPneuMali.png',
        rating: 4.5,
        sold: 185,
        profit: 19500
      },
      {
        id: 3,
        name: 'Continental PremiumContact 6',
        image: '/img/logoPneuMali.png',
        rating: 4.8,
        sold: 165,
        profit: 18300
      }
    ];

    this.customerStats = {
      male: 942,
      female: 2452
    };

    this.distributionMap = {
      asia: 90,
      america: 30,
      europe: 40,
      others: 25
    };

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
          backgroundColor: '#3b82f6',
          borderRadius: 6,
          barThickness: 30
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
            backgroundColor: '#1f2937',
            padding: 12,
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#374151',
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
              callback: (value: any) => this.formatCurrency(Number(value))
            },
            grid: {
              color: '#f3f4f6'
            }
          },
          x: {
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
          backgroundColor: ['#3b82f6', '#93c5fd'],
          borderWidth: 0
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
            backgroundColor: '#1f2937',
            padding: 12,
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
   * Met à jour le thème des graphiques
   */
  private updateChartsTheme(isDark: boolean): void {
    const textColor = isDark ? '#f9fafb' : '#111827';
    const gridColor = isDark ? '#374151' : '#e5e7eb';

    if (this.salesChart) {
      this.salesChart.options.scales!['y']!.ticks!.color = textColor;
      this.salesChart.options.scales!['y']!.grid!.color = gridColor;
      this.salesChart.options.scales!['x']!.ticks!.color = textColor;
      this.salesChart.options.scales!['x']!.grid!.color = gridColor;
      this.salesChart.options.plugins!.tooltip!.backgroundColor = isDark ? '#1a1a1a' : '#1f2937';
      this.salesChart.update();
    }

    if (this.customerChart) {
      this.customerChart.options.plugins!.tooltip!.backgroundColor = isDark ? '#1a1a1a' : '#1f2937';
      this.customerChart.update();
    }
  }
}

