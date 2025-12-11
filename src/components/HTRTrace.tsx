import { useEffect, useRef, useState } from 'react';
import Tesseract from 'tesseract.js';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

interface HTRTraceProps {
  imageFile: File | null;
  onTextExtracted?: (text: string) => void;
}

const HTRTrace = ({ imageFile, onTextExtracted }: HTRTraceProps) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!imageFile) return;

    const processImage = async () => {
      setIsProcessing(true);
      setProgress(0);
      setStatus('Initializing OCR...');
      setText('');

      const imageUrl = URL.createObjectURL(imageFile);
      
      try {
        const result = await Tesseract.recognize(
          imageUrl,
          'eng',
          {
            logger: (m) => {
              if (m.status === 'recognizing text') {
                setProgress(Math.round(m.progress * 100));
                setStatus(`Recognizing text... ${Math.round(m.progress * 100)}%`);
              } else {
                setStatus(m.status);
              }
            }
          }
        );

        setText(result.data.text);
        if (onTextExtracted) onTextExtracted(result.data.text);
        
        // Draw boxes
        drawBoxes(result.data, imageUrl);
        
      } catch (err) {
        console.error("OCR Error:", err);
        setStatus('Error during recognition');
      } finally {
        setIsProcessing(false);
      }
    };

    processImage();
    
    // Cleanup
    return () => {
        // We can revoke, but we need it for the canvas drawing async
    };
  }, [imageFile]);

  const drawBoxes = (data: Tesseract.Page, imageUrl: string) => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    
    // We need to wait for the image element to load the source
    if (!img) return;

    img.onload = () => {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas to match image natural dimensions
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        // Draw image
        ctx.drawImage(img, 0, 0);

        // Draw boxes
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(124, 58, 237, 0.7)'; // Primary color purple-ish
        ctx.fillStyle = 'rgba(124, 58, 237, 0.1)';

        data.words.forEach((word) => {
            const { x0, y0, x1, y1 } = word.bbox;
            ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
            ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
        });
    };
    img.src = imageUrl;
  };

  if (!imageFile) return null;

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
      <div className="space-y-2">
        <Label>Live Tracing & Recognition</Label>
        <Card className="overflow-hidden bg-muted/20 border-2 border-dashed">
            {/* Hidden image for loading source */}
            <img 
                ref={imageRef} 
                className="hidden" 
                alt="Source"
            />
            
            <canvas 
                ref={canvasRef}
                className="w-full h-auto block"
                style={{ maxHeight: '400px', objectFit: 'contain' }}
            />
        </Card>
      </div>

      {isProcessing && (
        <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
                <span className="animate-pulse">{status}</span>
                <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="extracted-text">Generated Script (Editable)</Label>
        <Textarea 
            id="extracted-text"
            value={text} 
            onChange={(e) => setText(e.target.value)} 
            rows={8}
            className="font-mono text-sm bg-background/50 resize-y"
            placeholder="Text will appear here..."
        />
        <p className="text-xs text-muted-foreground">
            * Verify and edit the text above for maximum accuracy before submitting.
        </p>
      </div>
    </div>
  );
};

export default HTRTrace;
