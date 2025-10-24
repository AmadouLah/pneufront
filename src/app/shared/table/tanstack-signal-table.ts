import { Signal, computed, signal, effect } from '@angular/core';
import {
  ColumnDef,
  SortingState,
  Table,
  createTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
} from '@tanstack/table-core';

export type TableApi<T> = {
  table: Signal<Table<T>>;
  tri: Signal<SortingState>;
  filtreTexte: Signal<string>;
  pageIndex: Signal<number>;
  pageSize: Signal<number>;
  headerGroups: Signal<ReturnType<Table<T>['getHeaderGroups']>>;
  rows: Signal<ReturnType<Table<T>['getPaginationRowModel']>['rows']>;
  total: Signal<number>;
  pageCount: Signal<number>;
  iconeTri: (colId: string) => string;
  basculerTri: (colId: string) => void;
  pagePrec: () => void;
  pageSuiv: () => void;
  changerTaille: (taille: number) => void;
  setFiltreGlobal: (valeur: string) => void;
  trackLigne: (_: number, row: any) => any;
};

export type CreerTableOpts<T> = {
  colonnes: ColumnDef<T, any>[];
  donnees: Signal<T[]>;
  pageSizeInitiale?: number;
  pageIndexInitial?: number;
  trackByProp?: keyof T;
  globalFilterPicker?: (item: T) => string;
};

export function creerTableSignal<T>(opts: CreerTableOpts<T>): TableApi<T> {
  const tri = signal<SortingState>([]);
  const filtreTexte = signal<string>('');
  const pageIndex = signal<number>(opts.pageIndexInitial ?? 0);
  const pageSize = signal<number>(opts.pageSizeInitiale ?? 10);

  const buildOptions = (data: T[], columns: ColumnDef<T, any>[]) => ({
    data,
    columns,
    state: {
      sorting: tri(),
      globalFilter: filtreTexte(),
      pagination: { pageIndex: pageIndex(), pageSize: pageSize() },
    },
    onStateChange: (_u: any) => {},
    renderFallbackValue: null as any,
    onSortingChange: (updater: any) => {
      const curr = tri();
      const next = typeof updater === 'function' ? updater(curr) : updater;
      tri.set(next as SortingState);
    },
    onPaginationChange: (updater: any) => {
      const curr = { pageIndex: pageIndex(), pageSize: pageSize() };
      const next = typeof updater === 'function' ? updater(curr) : updater;
      pageIndex.set(next.pageIndex);
      pageSize.set(next.pageSize);
    },
    onGlobalFilterChange: (updater: any) => {
      const curr = filtreTexte();
      const next = typeof updater === 'function' ? updater(curr) : updater;
      filtreTexte.set(next ?? '');
    },
    globalFilterFn: (row: any, _columnId: any, filterValue: any) => {
      const v = (filterValue ?? '').toString().toLowerCase().trim();
      if (!v) return true;
      const text = opts.globalFilterPicker
        ? opts.globalFilterPicker(row.original)
        : JSON.stringify(row.original ?? {}).toLowerCase();
      return text.includes(v);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // Créer une instance unique de table et mettre à jour ses options de façon réactive
  const table = signal<Table<T>>(createTable<T>(buildOptions((opts.donnees() ?? []) as T[], (opts.colonnes ?? []) as ColumnDef<T, any>[])));

  // Synchroniser les options (data, colonnes, state) à chaque changement pertinent
  effect(() => {
    const data = (opts.donnees() ?? []) as T[];
    const columns = (opts.colonnes ?? []) as ColumnDef<T, any>[];
    // Dépendances explicites pour Angular Signals
    const s = tri();
    const gf = filtreTexte();
    const pi = pageIndex();
    const ps = pageSize();

    try {
      table().setOptions(prev => ({
        ...prev,
        data,
        columns,
        state: {
          ...(prev as any).state,
          sorting: s,
          globalFilter: gf,
          pagination: { pageIndex: pi, pageSize: ps },
        },
      }));
    } catch {
      // no-op si la table n'est pas prête
    }
  });

  const headerGroups = computed(() => {
    // Inclure signaux pour recalcul (même si non utilisés directement)
    tri(); filtreTexte(); pageIndex(); pageSize(); opts.donnees();
    try { return table().getHeaderGroups(); } catch { return [] as any; }
  });
  const rows = computed(() => {
    tri(); filtreTexte(); pageIndex(); pageSize(); opts.donnees();
    try {
      const t = table();
      // S'assurer que la pagination est correctement configurée
      const paginationModel = t.getPaginationRowModel();
      return paginationModel.rows;
    } catch {
      return [] as any;
    }
  });
  const total = computed(() => {
    tri(); filtreTexte(); opts.donnees();
    try { return table().getFilteredRowModel().rows.length; } catch { return 0; }
  });
  const pageCount = computed(() => {
    tri(); filtreTexte(); pageIndex(); pageSize(); opts.donnees();
    try { return table().getPageCount(); } catch { return 0; }
  });

  const iconeTri = (colId: string): string => {
    const s = tri();
    const found = s.find(x => x.id === colId);
    if (!found) return '';
    return found.desc ? '▼' : '▲';
  };

  const basculerTri = (colId: string) => {
    const actuel = tri();
    const exist = actuel.find(s => s.id === colId);
    if (!exist) {
      tri.set([{ id: colId, desc: false }]);
    } else if (exist.desc === false) {
      tri.set([{ id: colId, desc: true }]);
    } else {
      tri.set([]);
    }
  };

  const pagePrec = () => {
    const t = table();
    if (t.getCanPreviousPage()) {
      const currentIndex = pageIndex();
      if (currentIndex > 0) {
        pageIndex.set(currentIndex - 1);
      }
    }
  };

  const pageSuiv = () => {
    const t = table();
    if (t.getCanNextPage()) {
      const currentIndex = pageIndex();
      const totalPages = t.getPageCount();
      if (currentIndex < totalPages - 1) {
        pageIndex.set(currentIndex + 1);
      }
    }
  };

  const changerTaille = (taille: number) => {
    const nouvelleTaille = Number(taille);
    pageSize.set(nouvelleTaille);
    pageIndex.set(0);
    
    // Forcer la mise à jour de la table avec les nouvelles valeurs
    setTimeout(() => {
      try {
        const t = table();
        t.setPageSize(nouvelleTaille);
        t.setPageIndex(0);
      } catch {
        // no-op si la table n'est pas prête
      }
    }, 0);
  };

  const setFiltreGlobal = (valeur: string) => {
    filtreTexte.set(valeur ?? '');
    pageIndex.set(0);
  };

  const trackLigne = (_: number, row: any) => {
    const key = opts.trackByProp as string | undefined;
    return key ? row?.original?.[key] ?? row?.id : row?.id;
  };

  return {
    table,
    tri,
    filtreTexte,
    pageIndex,
    pageSize,
    headerGroups,
    rows,
    total,
    pageCount,
    iconeTri,
    basculerTri,
    pagePrec,
    pageSuiv,
    changerTaille,
    setFiltreGlobal,
    trackLigne,
  };
}
