import { useState } from "react";

interface ShareData {
  title: string;
  url?: string;
  description?: string;
}

export const useShare = () => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareData, setShareData] = useState<ShareData>({ title: "" });

  const openShareModal = (data: ShareData) => {
    setShareData(data);
    setIsShareModalOpen(true);
  };

  const closeShareModal = () => {
    setIsShareModalOpen(false);
  };

  return {
    isShareModalOpen,
    shareData,
    openShareModal,
    closeShareModal
  };
};