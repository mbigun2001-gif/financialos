"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Upload,
  FileText,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
} from "lucide-react";
import { dataStore, Transaction, Category } from "@/lib/data";
import { motion } from "framer-motion";

interface ImportedRow {
  [key: string]: string | number;
}

interface ColumnMapping {
  amount: string;
  date: string;
  description: string;
  category?: string;
  source?: string;
  type?: string;
}

export function TransactionImport() {
  const [showDialog, setShowDialog] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<"table" | "image">("table");
  const [parsedData, setParsedData] = useState<ImportedRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    amount: "",
    date: "",
    description: "",
    category: "",
    source: "",
    type: "",
  });
  const [transactionType, setTransactionType] = useState<"income" | "expense" | "auto">("auto");
  const [previewData, setPreviewData] = useState<Transaction[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const incomeCategories = dataStore.categories.getByType("income").map(c => c.name);
  const expenseCategories = dataStore.categories.getByType("expense").map(c => c.name);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setImportResult(null);

    if (importType === "table") {
      await parseTableFile(selectedFile);
    } else {
      // Для зображень поки що просто зберігаємо файл
      setParsedData([]);
      setColumns([]);
    }
  };

  const parseTableFile = async (file: File) => {
    try {
      const text = await file.text();
      let rows: ImportedRow[] = [];
      let headers: string[] = [];

      if (file.name.endsWith(".csv")) {
        // Парсинг CSV
        const lines = text.split("\n").filter(line => line.trim());
        if (lines.length === 0) {
          alert("Файл порожній");
          return;
        }

        // Парсинг заголовків
        headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
        
        // Парсинг рядків
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",").map(v => v.trim().replace(/"/g, ""));
          const row: ImportedRow = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || "";
          });
          if (Object.values(row).some(v => v !== "")) {
            rows.push(row);
          }
        }
      } else if (file.name.endsWith(".json")) {
        // Парсинг JSON
        const json = JSON.parse(text);
        if (Array.isArray(json)) {
          rows = json;
          if (rows.length > 0) {
            headers = Object.keys(rows[0]);
          }
        } else {
          alert("JSON файл повинен містити масив об'єктів");
          return;
        }
      } else {
        alert("Підтримуються тільки CSV та JSON файли");
        return;
      }

      setParsedData(rows);
      setColumns(headers);
      
      // Автоматичне визначення маппінгу
      autoDetectMapping(headers);
    } catch (error: any) {
      alert(`Помилка парсингу файлу: ${error.message}`);
    }
  };

  const autoDetectMapping = (headers: string[]) => {
    const mapping: ColumnMapping = {
      amount: "",
      date: "",
      description: "",
      category: "",
      source: "",
      type: "",
    };

    headers.forEach(header => {
      const lower = header.toLowerCase();
      if (lower.includes("сума") || lower.includes("amount") || lower.includes("сумма")) {
        mapping.amount = header;
      } else if (lower.includes("дата") || lower.includes("date") || lower.includes("день")) {
        mapping.date = header;
      } else if (lower.includes("опис") || lower.includes("description") || lower.includes("коментар") || lower.includes("comment")) {
        mapping.description = header;
      } else if (lower.includes("категорія") || lower.includes("category") || lower.includes("категория")) {
        mapping.category = header;
      } else if (lower.includes("джерело") || lower.includes("source") || lower.includes("источник")) {
        mapping.source = header;
      } else if (lower.includes("тип") || lower.includes("type")) {
        mapping.type = header;
      }
    });

    setColumnMapping(mapping);
  };

  const generatePreview = () => {
    if (parsedData.length === 0) return;

    const preview: Transaction[] = [];
    const errors: string[] = [];

    parsedData.slice(0, 10).forEach((row, index) => {
      try {
        const amount = parseFloat(String(row[columnMapping.amount] || 0));
        if (isNaN(amount) || amount === 0) {
          errors.push(`Рядок ${index + 1}: невалідна сума`);
          return;
        }

        let date = new Date().toISOString();
        if (columnMapping.date && row[columnMapping.date]) {
          const dateStr = String(row[columnMapping.date]);
          const parsedDate = new Date(dateStr);
          if (!isNaN(parsedDate.getTime())) {
            date = parsedDate.toISOString();
          }
        }

        let type: "income" | "expense" = "expense";
        if (transactionType === "auto" && columnMapping.type) {
          const typeStr = String(row[columnMapping.type] || "").toLowerCase();
          type = typeStr.includes("дохід") || typeStr.includes("income") || typeStr.includes("прибуток") ? "income" : "expense";
        } else {
          type = transactionType === "auto" ? "expense" : transactionType;
        }

        let category = type === "income" ? incomeCategories[0] || "Інше" : expenseCategories[0] || "Інше";
        if (columnMapping.category && row[columnMapping.category]) {
          const catStr = String(row[columnMapping.category]);
          if (type === "income" && incomeCategories.includes(catStr)) {
            category = catStr;
          } else if (type === "expense" && expenseCategories.includes(catStr)) {
            category = catStr;
          }
        }

        let source = "";
        if (type === "income") {
          if (columnMapping.source && row[columnMapping.source]) {
            const sourceStr = String(row[columnMapping.source]);
            if (incomeCategories.includes(sourceStr)) {
              source = sourceStr;
            } else {
              source = incomeCategories[0] || "Інше";
            }
          } else {
            source = incomeCategories[0] || "Інше";
          }
        }

        preview.push({
          id: `preview_${index}`,
          type,
          amount,
          category: type === "income" ? "income" : category,
          description: String(row[columnMapping.description] || ""),
          date,
          source: type === "income" ? source : undefined,
          status: type === "income" ? "received" : undefined,
        });
      } catch (error: any) {
        errors.push(`Рядок ${index + 1}: ${error.message}`);
      }
    });

    setPreviewData(preview);
    if (errors.length > 0) {
      alert(`Помилки в попередньому перегляді:\n${errors.slice(0, 5).join("\n")}`);
    }
  };

  const handleImport = async () => {
    if (parsedData.length === 0) {
      alert("Немає даних для імпорту");
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    try {
      for (let i = 0; i < parsedData.length; i++) {
        const row = parsedData[i];
        try {
          const amount = parseFloat(String(row[columnMapping.amount] || 0));
          if (isNaN(amount) || amount === 0) {
            failed++;
            errors.push(`Рядок ${i + 1}: невалідна сума`);
            continue;
          }

          let date = new Date().toISOString();
          if (columnMapping.date && row[columnMapping.date]) {
            const dateStr = String(row[columnMapping.date]);
            const parsedDate = new Date(dateStr);
            if (!isNaN(parsedDate.getTime())) {
              date = parsedDate.toISOString();
            }
          }

          let type: "income" | "expense" = "expense";
          if (transactionType === "auto" && columnMapping.type) {
            const typeStr = String(row[columnMapping.type] || "").toLowerCase();
            type = typeStr.includes("дохід") || typeStr.includes("income") || typeStr.includes("прибуток") ? "income" : "expense";
          } else {
            type = transactionType === "auto" ? "expense" : transactionType;
          }

          let category = type === "income" ? incomeCategories[0] || "Інше" : expenseCategories[0] || "Інше";
          if (columnMapping.category && row[columnMapping.category]) {
            const catStr = String(row[columnMapping.category]);
            if (type === "income" && incomeCategories.includes(catStr)) {
              category = catStr;
            } else if (type === "expense" && expenseCategories.includes(catStr)) {
              category = catStr;
            }
          }

          let source = "";
          if (type === "income") {
            if (columnMapping.source && row[columnMapping.source]) {
              const sourceStr = String(row[columnMapping.source]);
              if (incomeCategories.includes(sourceStr)) {
                source = sourceStr;
              } else {
                source = incomeCategories[0] || "Інше";
              }
            } else {
              source = incomeCategories[0] || "Інше";
            }
          }

          const transaction: Transaction = {
            id: `${Date.now()}_${i}`,
            type,
            amount,
            category: type === "income" ? "income" : category,
            description: String(row[columnMapping.description] || ""),
            date,
            source: type === "income" ? source : undefined,
            status: type === "income" ? "received" : undefined,
          };

          dataStore.transactions.add(transaction);
          success++;
        } catch (error: any) {
          failed++;
          errors.push(`Рядок ${i + 1}: ${error.message}`);
        }
      }

      setImportResult({ success, failed, errors: errors.slice(0, 10) });
      
      // Очищаємо форму
      setFile(null);
      setParsedData([]);
      setColumns([]);
      setPreviewData([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error: any) {
      alert(`Помилка імпорту: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        Сума: 1000,
        Дата: "2024-01-15",
        Опис: "Приклад транзакції",
        Категорія: "Бізнес",
        Джерело: "Shopify",
        Тип: "Дохід"
      }
    ];
    const csv = [
      Object.keys(template[0]).join(","),
      ...template.map(row => Object.values(row).join(","))
    ].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "template_transactions.csv";
    link.click();
  };

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        variant="outline"
        className="w-full"
      >
        <Upload className="h-4 w-4 mr-2" />
        Імпортувати транзакції
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Імпорт транзакцій</DialogTitle>
            <DialogDescription>
              Імпортуйте доходи та розходи з таблиць (CSV, JSON) або фотографій
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Тип імпорту */}
            <div>
              <Label>Тип імпорту</Label>
              <div className="flex gap-4 mt-2">
                <Button
                  type="button"
                  variant={importType === "table" ? "default" : "outline"}
                  onClick={() => setImportType("table")}
                  className="flex-1"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  З таблиці (CSV, JSON)
                </Button>
                <Button
                  type="button"
                  variant={importType === "image" ? "default" : "outline"}
                  onClick={() => setImportType("image")}
                  className="flex-1"
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  З фотографії
                </Button>
              </div>
            </div>

            {importType === "table" ? (
              <>
                {/* Завантаження файлу */}
                <div>
                  <Label>Виберіть файл</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.json"
                      onChange={handleFileSelect}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={downloadTemplate}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Шаблон
                    </Button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Підтримуються CSV та JSON файли
                  </p>
                </div>

                {/* Тип транзакцій */}
                {parsedData.length > 0 && (
                  <div>
                    <Label>Тип транзакцій</Label>
                    <Select
                      value={transactionType}
                      onChange={(e) => setTransactionType(e.target.value as "income" | "expense" | "auto")}
                    >
                      <option value="auto">Автоматично (з файлу)</option>
                      <option value="income">Тільки доходи</option>
                      <option value="expense">Тільки розходи</option>
                    </Select>
                  </div>
                )}

                {/* Маппінг колонок */}
                {columns.length > 0 && (
                  <div className="space-y-3">
                    <Label>Відповідність колонок</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="map-amount" className="text-xs">Сума *</Label>
                        <Select
                          id="map-amount"
                          value={columnMapping.amount}
                          onChange={(e) => setColumnMapping({ ...columnMapping, amount: e.target.value })}
                        >
                          <option value="">Оберіть колонку</option>
                          {columns.map(col => (
                            <option key={col} value={col}>{col}</option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="map-date" className="text-xs">Дата</Label>
                        <Select
                          id="map-date"
                          value={columnMapping.date}
                          onChange={(e) => setColumnMapping({ ...columnMapping, date: e.target.value })}
                        >
                          <option value="">Оберіть колонку</option>
                          {columns.map(col => (
                            <option key={col} value={col}>{col}</option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="map-description" className="text-xs">Опис</Label>
                        <Select
                          id="map-description"
                          value={columnMapping.description}
                          onChange={(e) => setColumnMapping({ ...columnMapping, description: e.target.value })}
                        >
                          <option value="">Оберіть колонку</option>
                          {columns.map(col => (
                            <option key={col} value={col}>{col}</option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="map-category" className="text-xs">Категорія</Label>
                        <Select
                          id="map-category"
                          value={columnMapping.category || ""}
                          onChange={(e) => setColumnMapping({ ...columnMapping, category: e.target.value })}
                        >
                          <option value="">Оберіть колонку</option>
                          {columns.map(col => (
                            <option key={col} value={col}>{col}</option>
                          ))}
                        </Select>
                      </div>
                      {transactionType !== "expense" && (
                        <div>
                          <Label htmlFor="map-source" className="text-xs">Джерело доходу</Label>
                          <Select
                            id="map-source"
                            value={columnMapping.source || ""}
                            onChange={(e) => setColumnMapping({ ...columnMapping, source: e.target.value })}
                          >
                            <option value="">Оберіть колонку</option>
                            {columns.map(col => (
                              <option key={col} value={col}>{col}</option>
                            ))}
                          </Select>
                        </div>
                      )}
                      {transactionType === "auto" && (
                        <div>
                          <Label htmlFor="map-type" className="text-xs">Тип (дохід/розхід)</Label>
                          <Select
                            id="map-type"
                            value={columnMapping.type || ""}
                            onChange={(e) => setColumnMapping({ ...columnMapping, type: e.target.value })}
                          >
                            <option value="">Оберіть колонку</option>
                            {columns.map(col => (
                              <option key={col} value={col}>{col}</option>
                            ))}
                          </Select>
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      onClick={generatePreview}
                      variant="outline"
                      className="w-full"
                    >
                      Попередній перегляд (перші 10 рядків)
                    </Button>
                  </div>
                )}

                {/* Попередній перегляд */}
                {previewData.length > 0 && (
                  <div>
                    <Label>Попередній перегляд</Label>
                    <div className="mt-2 max-h-60 overflow-y-auto border border-slate-800 rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-800 sticky top-0">
                          <tr>
                            <th className="p-2 text-left">Тип</th>
                            <th className="p-2 text-left">Сума</th>
                            <th className="p-2 text-left">Дата</th>
                            <th className="p-2 text-left">Опис</th>
                            <th className="p-2 text-left">Категорія</th>
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.map((row, i) => (
                            <tr key={i} className="border-t border-slate-800">
                              <td className="p-2">{row.type === "income" ? "Дохід" : "Розхід"}</td>
                              <td className="p-2">₴{row.amount.toFixed(2)}</td>
                              <td className="p-2">{new Date(row.date).toLocaleDateString("uk-UA")}</td>
                              <td className="p-2">{row.description || "-"}</td>
                              <td className="p-2">{row.category}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Результат імпорту */}
                {importResult && (
                  <div className={`p-4 rounded-lg ${importResult.failed > 0 ? "bg-red-500/10 border border-red-500/30" : "bg-green-500/10 border border-green-500/30"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {importResult.failed > 0 ? (
                        <XCircle className="h-5 w-5 text-red-400" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-green-400" />
                      )}
                      <p className={`font-semibold ${importResult.failed > 0 ? "text-red-400" : "text-green-400"}`}>
                        Імпорт завершено
                      </p>
                    </div>
                    <p className="text-sm text-slate-300">
                      Успішно: {importResult.success} | Помилок: {importResult.failed}
                    </p>
                    {importResult.errors.length > 0 && (
                      <div className="mt-2 text-xs text-red-400">
                        <p>Помилки:</p>
                        <ul className="list-disc list-inside">
                          {importResult.errors.map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Кнопки */}
                {parsedData.length > 0 && (
                  <div className="flex gap-3 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowDialog(false)}
                    >
                      Скасувати
                    </Button>
                    <Button
                      type="button"
                      onClick={handleImport}
                      disabled={isImporting || !columnMapping.amount}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      {isImporting ? "Імпорт..." : `Імпортувати ${parsedData.length} транзакцій`}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <ImageIcon className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400 mb-4">
                  Завантажте фотографію з таблицею транзакцій
                </p>
                <Input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0];
                    if (selectedFile) {
                      alert("Функція імпорту з фотографій в розробці. Будь ласка, використовуйте імпорт з таблиць.");
                    }
                  }}
                  className="max-w-xs mx-auto"
                />
                <p className="text-xs text-slate-500 mt-4">
                  Підтримка OCR для фотографій буде додана в майбутніх оновленнях
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
