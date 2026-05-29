import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { X, Cpu, HardDrive, Gauge, Network, Tag, FileText } from 'lucide-react';
import type { VPSInfo } from '@/types/calculator';

interface VPSInfoFormProps {
  value: VPSInfo;
  onChange: (value: VPSInfo) => void;
}

export function VPSInfoForm({ value, onChange }: VPSInfoFormProps) {
  const [featureInput, setFeatureInput] = useState('');

  const updateField = useCallback(
    <K extends keyof VPSInfo>(field: K, fieldValue: VPSInfo[K]) => {
      onChange({ ...value, [field]: fieldValue });
    },
    [value, onChange]
  );

  const handleFeatureInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && featureInput.trim()) {
      e.preventDefault();
      const newFeature = featureInput.trim();
      if (!value.features.includes(newFeature)) {
        updateField('features', [...value.features, newFeature]);
      }
      setFeatureInput('');
    }
  };

  const addFeature = () => {
    if (featureInput.trim() && !value.features.includes(featureInput.trim())) {
      updateField('features', [...value.features, featureInput.trim()]);
      setFeatureInput('');
    }
  };

  const removeFeature = (index: number) => {
    updateField(
      'features',
      value.features.filter((_, i) => i !== index)
    );
  };

  return (
    <div className="glass-card p-6 space-y-6">
      <h3 className="text-xl font-semibold text-white/95">VPS 基本信息</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="provider">服务商</Label>
          <Input
            id="provider"
            placeholder="例如: Vultr, Linode"
            value={value.provider}
            onChange={(e) => updateField('provider', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="model">型号</Label>
          <Input
            id="model"
            placeholder="例如: 2C4G"
            value={value.model}
            onChange={(e) => updateField('model', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cpu">
          <Cpu className="inline h-4 w-4 mr-1" />
          CPU (核)
        </Label>
        <Input
          id="cpu"
          type="number"
          placeholder="例如: 2"
          value={value.cpu ?? ''}
          onChange={(e) =>
            updateField('cpu', e.target.value === '' ? null : Number(e.target.value))
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ram">内存</Label>
        <div className="flex gap-2">
          <Input
            id="ram"
            type="number"
            placeholder="例如: 4"
            value={value.ram.value ?? ''}
            onChange={(e) =>
              updateField('ram', {
                ...value.ram,
                value: Number(e.target.value),
              })
            }
            className="flex-1"
          />
          <Select
            value={value.ram.unit}
            onChange={(e) =>
              updateField('ram', {
                ...value.ram,
                unit: e.target.value as 'GB' | 'MB',
              })
            }
            className="w-24"
          >
            <option value="GB">GB</option>
            <option value="MB">MB</option>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="storage">
          <HardDrive className="inline h-4 w-4 mr-1" />
          存储
        </Label>
        <div className="flex gap-2">
          <Input
            id="storage"
            type="number"
            placeholder="例如: 50"
            value={value.storage.value ?? ''}
            onChange={(e) =>
              updateField('storage', {
                ...value.storage,
                value: Number(e.target.value),
              })
            }
            className="flex-1"
          />
          <Select
            value={value.storage.type}
            onChange={(e) =>
              updateField('storage', {
                ...value.storage,
                type: e.target.value as 'SSD' | 'HDD' | 'NVMe',
              })
            }
            className="w-24"
          >
            <option value="SSD">SSD</option>
            <option value="HDD">HDD</option>
            <option value="NVMe">NVMe</option>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bandwidth">
          <Network className="inline h-4 w-4 mr-1" />
          带宽
        </Label>
        <div className="flex gap-2">
          <Input
            id="bandwidth"
            type="number"
            placeholder="例如: 100"
            value={value.bandwidth.value ?? ''}
            onChange={(e) =>
              updateField('bandwidth', {
                ...value.bandwidth,
                value: Number(e.target.value),
              })
            }
            className="flex-1"
          />
          <Select
            value={value.bandwidth.unit}
            onChange={(e) =>
              updateField('bandwidth', {
                ...value.bandwidth,
                unit: e.target.value as 'Mbps' | 'Gbps',
              })
            }
            className="w-24"
          >
            <option value="Mbps">Mbps</option>
            <option value="Gbps">Gbps</option>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="traffic">
          <Gauge className="inline h-4 w-4 mr-1" />
          流量
        </Label>
        <div className="flex gap-2 items-center">
          <Input
            id="traffic"
            type="number"
            placeholder="例如: 1000"
            disabled={value.traffic.unlimited}
            value={value.traffic.value ?? ''}
            onChange={(e) =>
              updateField('traffic', {
                ...value.traffic,
                value: Number(e.target.value),
              })
            }
            className="flex-1"
          />
          <Select
            value={value.traffic.unit}
            onChange={(e) =>
              updateField('traffic', {
                ...value.traffic,
                unit: e.target.value as 'GB' | 'TB',
              })
            }
            className="w-24"
            disabled={value.traffic.unlimited}
          >
            <option value="GB">GB</option>
            <option value="TB">TB</option>
          </Select>
          <label className="flex items-center gap-2 text-sm text-white/70 whitespace-nowrap cursor-pointer">
            <input
              type="checkbox"
              checked={value.traffic.unlimited}
              onChange={(e) =>
                updateField('traffic', {
                  ...value.traffic,
                  unlimited: e.target.checked,
                })
              }
              className="h-4 w-4 rounded border-white/20 bg-white/[0.06] text-blue-400 focus:ring-blue-400"
            />
            不限流量
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="features">
          <Tag className="inline h-4 w-4 mr-1" />
          功能标签
        </Label>
        <div className="flex gap-2">
          <Input
            id="features"
            placeholder="输入标签后按回车添加"
            value={featureInput}
            onChange={(e) => setFeatureInput(e.target.value)}
            onKeyDown={handleFeatureInputKeyDown}
            className="flex-1"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={addFeature}
          >
            添加
          </Button>
        </div>
        {value.features.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {value.features.map((feature, index) => (
              <span
                key={`${feature}-${index}`}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-400/20 text-blue-300 text-sm"
              >
                {feature}
                <button
                  type="button"
                  onClick={() => removeFeature(index)}
                  className="inline-flex items-center justify-center h-4 w-4 rounded-full hover:bg-blue-400/30 transition-colors"
                  aria-label={`移除 ${feature}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">
          <FileText className="inline h-4 w-4 mr-1" />
          备注
        </Label>
        <textarea
          id="notes"
          placeholder="其他备注信息..."
          value={value.notes}
          onChange={(e) => updateField('notes', e.target.value)}
          className={cn(
            'glass-input',
            '!h-auto min-h-[100px] resize-y'
          )}
        />
      </div>
    </div>
  );
}
