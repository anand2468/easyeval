import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Upload, Camera, X, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface UploadResponseProps {
  examId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const UploadResponse = ({ examId, onClose, onSuccess }: UploadResponseProps) => {
  const [rollNumber, setRollNumber] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const clearSelection = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile || !rollNumber.trim()) {
      toast.error('Please provide both roll number and image');
      return;
    }

    setIsUploading(true);

    try {
      // Check if roll number already exists for this exam
      const { data: existingResponse } = await supabase
        .from('responses')
        .select('id')
        .eq('exam_id', examId)
        .eq('roll_number', rollNumber.trim())
        .single();

      if (existingResponse) {
        toast.error('A response with this roll number already exists');
        setIsUploading(false);
        return;
      }

      // Upload image to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${examId}/${rollNumber.trim()}_${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('response-images')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('response-images')
        .getPublicUrl(fileName);

      // Save response to database
      const { data: response, error: responseError } = await supabase
        .from('responses')
        .insert({
          exam_id: examId,
          roll_number: rollNumber.trim(),
          image_url: publicUrl,
        })
        .select()
        .single();

      if (responseError) throw responseError;

      toast.success('Response uploaded successfully!');
      
      // Start AI evaluation
      setIsEvaluating(true);
      try {
        const { data: evaluationResult, error: evalError } = await supabase.functions
          .invoke('evaluate-response', {
            body: { 
              responseId: response.id,
              imageUrl: publicUrl 
            }
          });

        if (evalError) {
          console.error('Evaluation error:', evalError);
          toast.warning('Response uploaded but evaluation failed. You can retry evaluation later.');
        } else {
          toast.success('Response evaluated successfully!');
        }
      } catch (evalError) {
        console.error('Evaluation error:', evalError);
        toast.warning('Response uploaded but evaluation failed. You can retry evaluation later.');
      }

      setIsEvaluating(false);
      onSuccess();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Failed to upload response: ' + error.message);
      setIsUploading(false);
      setIsEvaluating(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Student Response</DialogTitle>
          <DialogDescription>
            Upload an answer sheet image and provide the student's roll number
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Roll Number Input */}
          <div className="space-y-2">
            <Label htmlFor="rollNumber">Student Roll Number *</Label>
            <Input
              id="rollNumber"
              type="text"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              placeholder="Enter student roll number"
              required
            />
          </div>

          {/* File Upload Section */}
          <div className="space-y-4">
            <Label>Answer Sheet Image *</Label>
            
            {!selectedFile ? (
              <div className="space-y-4">
                {/* Upload Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card 
                    className="upload-zone cursor-pointer"
                    onClick={handleFileUpload}
                  >
                    <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                      <Upload className="h-10 w-10 text-primary mb-4" />
                      <h3 className="font-semibold mb-2">Upload from Device</h3>
                      <p className="text-sm text-muted-foreground">
                        Choose an image file from your device
                      </p>
                    </CardContent>
                  </Card>

                  <Card 
                    className="upload-zone cursor-pointer"
                    onClick={handleCameraCapture}
                  >
                    <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                      <Camera className="h-10 w-10 text-primary mb-4" />
                      <h3 className="font-semibold mb-2">Take Photo</h3>
                      <p className="text-sm text-muted-foreground">
                        Capture image using your camera
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Preview */}
                <Card className="academic-card">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Selected Image</CardTitle>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearSelection}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {previewUrl && (
                      <div className="relative">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full max-h-64 object-contain rounded-lg border"
                        />
                      </div>
                    )}
                    <div className="mt-3 text-sm text-muted-foreground">
                      <p><strong>File:</strong> {selectedFile.name}</p>
                      <p><strong>Size:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </CardContent>
                </Card>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  Choose Different Image
                </Button>
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isUploading || isEvaluating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedFile || !rollNumber.trim() || isUploading || isEvaluating}
              className="academic-gradient text-white shadow-[var(--shadow-primary)]"
            >
              {isUploading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </div>
              ) : isEvaluating ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Evaluating...
                </div>
              ) : (
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Upload & Evaluate
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UploadResponse;