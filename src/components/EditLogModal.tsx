import { X } from 'lucide-react';

interface EditLogModalProps {
  isOpen: boolean;
  editingLogType: 'sleep' | 'feed' | null;
  editStartTime: string;
  editEndTime: string;
  editBoobSide: 'left' | 'right';
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onDelete: () => void;
  onEditStartTimeChange: (value: string) => void;
  onEditEndTimeChange: (value: string) => void;
  onEditBoobSideChange: (value: 'left' | 'right') => void;
}

function EditLogModal({
  isOpen,
  editingLogType,
  editStartTime,
  editEndTime,
  editBoobSide,
  onClose,
  onSubmit,
  onDelete,
  onEditStartTimeChange,
  onEditEndTimeChange,
  onEditBoobSideChange,
}: EditLogModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {editingLogType === 'feed' ? 'Edit Feed Log' : 'Edit Sleep Log'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
            <input
              type="datetime-local"
              step="1"
              value={editStartTime}
              onChange={(e) => onEditStartTimeChange(e.target.value)}
              className="w-full p-4 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-pink-300 outline-none bg-pink-50/30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
            <input
              type="datetime-local"
              step="1"
              value={editEndTime}
              onChange={(e) => onEditEndTimeChange(e.target.value)}
              className="w-full p-4 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-pink-300 outline-none bg-pink-50/30"
              placeholder="Still sleeping..."
            />
          </div>

          {editingLogType === 'feed' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Side</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => onEditBoobSideChange('left')}
                  className={`py-3 rounded-2xl font-semibold border transition-colors ${editBoobSide === 'left' ? 'bg-emerald-100 border-emerald-400 text-emerald-800' : 'bg-white border-gray-200 text-gray-500'}`}
                >
                  Left
                </button>
                <button
                  type="button"
                  onClick={() => onEditBoobSideChange('right')}
                  className={`py-3 rounded-2xl font-semibold border transition-colors ${editBoobSide === 'right' ? 'bg-emerald-100 border-emerald-400 text-emerald-800' : 'bg-white border-gray-200 text-gray-500'}`}
                >
                  Right
                </button>
              </div>
            </div>
          )}

          <div className="pt-4 flex flex-col gap-3">
            <button
              type="submit"
              className="w-full bg-pink-500 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-pink-600 transition-colors"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="w-full text-red-500 py-4 font-semibold hover:bg-red-50 rounded-2xl transition-colors"
            >
              Delete Log
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditLogModal;
