'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { importDataAction } from '@/app/actions';
import { Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function ImportDataClient() {
  const [data, setData] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    customersAdded?: number;
    subscriptionsAdded?: number;
    errors?: string[];
    error?: string;
  } | null>(null);

  const handleImport = async () => {
    if (!data.trim()) {
      toast.error('Vui lòng dán dữ liệu vào');
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const res = await importDataAction(data);
      setResult(res);

      if (res.success) {
        toast.success(
          `Import thành công! ${res.customersAdded} khách hàng, ${res.subscriptionsAdded} subscription`,
        );
        setData('');
      } else {
        toast.error(`Lỗi: ${res.error}`);
      }
    } catch (error: any) {
      toast.error(`Lỗi: ${error.message}`);
      setResult({ success: false, error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Import dữ liệu lịch sử (TSV)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Paste dữ liệu (các cột cách nhau bằng TAB). Format: STT, Source, Tên khách, Account, Service, Start
            Date, End Date, Distribution, Revenue, Cost, Profit, Note.
          </p>
          <Textarea
            value={data}
            onChange={(e) => setData(e.target.value)}
            placeholder="Dán dữ liệu ở đây..."
            className="min-h-[300px] font-mono text-xs"
            disabled={isLoading}
          />
        </div>

        <Button onClick={handleImport} disabled={isLoading || !data.trim()} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang import...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Import dữ liệu
            </>
          )}
        </Button>

        {result && (
          <div
            className={`p-4 rounded-lg ${
              result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}
          >
            {result.success ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-semibold">Import thành công!</span>
                </div>
                <div className="text-sm text-green-700 space-y-1">
                  <p>• Khách hàng mới: {result.customersAdded}</p>
                  <p>• Subscription mới: {result.subscriptionsAdded}</p>
                  {result.errors && result.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="font-semibold">Cảnh báo:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {result.errors.slice(0, 5).map((err, i) => (
                          <li key={i} className="text-xs">
                            {err}
                          </li>
                        ))}
                        {result.errors.length > 5 && (
                          <li className="text-xs">... và {result.errors.length - 5} lỗi khác</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                <span className="font-semibold">Lỗi: {result.error}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
