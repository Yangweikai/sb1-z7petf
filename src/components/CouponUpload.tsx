import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Heart, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { analyzeImage } from '../services/imageAnalysis';
import Confetti from 'react-confetti';

interface CouponUploadProps {
  onSuccess: (coupon: { code: string; discount: number }) => void;
}

export const CouponUpload: React.FC<CouponUploadProps> = ({ onSuccess }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过5MB');
      return;
    }

    setIsAnalyzing(true);
    try {
      const isValidImage = await analyzeImage(file);
      
      if (isValidImage) {
        const discount = Math.floor(Math.random() * 20) + 10;
        const code = 'LOVE' + Math.random().toString(36).substring(2, 8).toUpperCase();
        
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
        
        toast.success(
          <div className="flex flex-col items-center gap-2">
            <span className="text-lg">🎉 恭喜获得优惠券！</span>
            <span className="font-bold text-red-500">￥{discount}</span>
          </div>,
          { duration: 5000 }
        );
        
        onSuccess({ code, discount });
      } else {
        toast.error('未能识别到牵手照片，请重新上传！');
      }
    } catch (error) {
      toast.error('图片处理失败，请确保图片格式正确');
      console.error('Image processing error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [onSuccess]);

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
    disabled: isAnalyzing
  });

  return (
    <div className="relative">
      {showConfetti && <Confetti recycle={false} numberOfPieces={200} />}
      
      <div className="p-6 bg-gradient-to-br from-pink-500/10 to-red-500/10 rounded-xl border border-red-500/20 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-4">
          <Heart className="text-red-500" size={28} fill="currentColor" />
          <h3 className="text-xl font-bold text-white">
            上传浪漫牵手照 解锁专属优惠
          </h3>
        </div>
        
        <div
          {...getRootProps()}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
            ${isDragActive 
              ? 'border-red-500 bg-red-500/10' 
              : 'border-red-500/30 hover:border-red-500 hover:bg-red-500/5'
            }
            ${isAnalyzing ? 'cursor-wait' : 'cursor-pointer'}
          `}
        >
          <input {...getInputProps()} />
          
          {isAnalyzing ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-red-500" size={32} />
              <p className="text-red-300">正在分析照片...</p>
            </div>
          ) : (
            <>
              <Upload 
                className={`mx-auto mb-4 ${isDragActive ? 'text-red-500' : 'text-red-400'}`} 
                size={32} 
              />
              
              {acceptedFiles.length > 0 ? (
                <div className="text-red-300">
                  已选择: {acceptedFiles[0].name}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      acceptedFiles.splice(0, acceptedFiles.length);
                    }}
                    className="ml-2 text-red-500 hover:text-red-400"
                  >
                    <X size={16} className="inline" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="font-medium text-red-300">
                    点击或拖拽上传你们的甜蜜合照
                  </p>
                  <p className="text-sm text-red-300/80">
                    支持 JPG/PNG 格式，大小不超过5MB
                  </p>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="mt-4 flex items-center justify-between text-sm text-red-300/80">
          <p>
            💝 分享甜蜜时刻，获取专属优惠
          </p>
          <p>
            🎁 随机优惠 10-30 元
          </p>
        </div>
      </div>
    </div>
  );
};