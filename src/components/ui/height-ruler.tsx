import React from 'react';

export const HeightRuler = () => {
  return (
    <div className="flex justify-center gap-20 font-sans mx-auto my-10">
      <div className="flex flex-col items-center border-l-2 border-border pl-4 text-right">
        <div className="text-lg my-15">130 см</div>
        <div className="text-lg my-15">140 см</div>
        <div className="text-lg my-15">150 см</div>
        <div className="text-lg my-15">160 см</div>
        <div className="text-lg my-15">170 см</div>
        <div className="text-lg my-15">180 см</div>
        <div className="text-lg my-15">190 см</div>
        <div className="text-lg my-15">200 см</div>
      </div>
      <div className="flex flex-col items-center border-l-2 border-border pl-4 text-left">
        <div className="text-lg my-15">4'3"</div>
        <div className="text-lg my-15">4'7"</div>
        <div className="text-lg my-15">5'0"</div>
        <div className="text-lg my-15">5'4"</div>
        <div className="text-lg my-15">5'8"</div>
        <div className="text-lg my-15">6'0"</div>
        <div className="text-lg my-15">6'4"</div>
        <div className="text-lg my-15">6'7"</div>
      </div>
    </div>
  );
};