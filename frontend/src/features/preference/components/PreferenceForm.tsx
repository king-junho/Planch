import React, { useState } from 'react';
import { X, CheckSquare, Square, Plus } from 'lucide-react';
import { usePreferenceStore } from '../store/usePreferenceStore';

export default function PreferenceForm() {
    const { preferences, updatePreference, toggleArrayItem, addArrayItem, removeArrayItem } = usePreferenceStore();
    const [mustGoInput, setMustGoInput] = useState('');
    const [mustAvoidInput, setMustAvoidInput] = useState('');

    const styleOptions = ['맛집', '카페', '관광', '휴식', '사진스팟', '쇼핑', '액티비티'];
    const timeOptions = ['오전', '오후', '저녁'];

    const handleAddTag = (e: React.KeyboardEvent, type: 'go' | 'avoid') => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const value = type === 'go' ? mustGoInput.trim() : mustAvoidInput.trim();
            if (!value) return;

            if (type === 'go') {
                addArrayItem('mustGo', value);
                setMustGoInput('');
            } else {
                addArrayItem('mustAvoid', value);
                setMustAvoidInput('');
            }
        }
    };

    return (
        <div className="flex flex-col gap-12">
            {/* 예산 설정 */}
            <section>
                <div className="flex justify-between items-end mb-6">
                    <h3 className="text-lg font-bold text-gray-900">여행 예산 (1인 기준)</h3>
                    <span className="text-blue-600 font-bold text-xl">
                        {preferences.budget >= 1000000 ? '100만원+' : `${(preferences.budget / 10000).toLocaleString()}만원 이하`}
                    </span>
                </div>
                <input
                    type="range"
                    min="50000"
                    max="1000000"
                    step="50000"
                    value={preferences.budget}
                    onChange={(e) => updatePreference('budget', Number(e.target.value))}
                    className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-gray-900"
                />
                <div className="flex justify-between mt-3 text-[10px] font-bold text-gray-300 px-1">
                    <span>5만원</span>
                    <span>50만원</span>
                    <span>100만원+</span>
                </div>
            </section>

            {/* 여행 스타일 */}
            <section>
                <h3 className="text-lg font-bold text-gray-900 mb-6">여행 스타일</h3>
                <div className="flex flex-wrap gap-2">
                    {styleOptions.map((style) => (
                        <button
                            key={style}
                            onClick={() => toggleArrayItem('styles', style)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${preferences.styles.includes(style)
                                    ? 'bg-gray-900 text-white shadow-md'
                                    : 'bg-white text-gray-400 border border-gray-100 hover:border-gray-200'
                                }`}
                        >
                            {style}
                        </button>
                    ))}
                </div>
            </section>

            {/* 태그 입력 (가고 싶은 곳 / 피하고 싶은 곳) */}
            <div className="grid grid-cols-2 gap-8">
                <section>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">꼭 가고 싶은 곳</h3>
                    <div className="relative mb-4">
                        <input
                            type="text"
                            value={mustGoInput}
                            onChange={(e) => setMustGoInput(e.target.value)}
                            onKeyDown={(e) => handleAddTag(e, 'go')}
                            placeholder="장소를 입력하고 Enter"
                            className="w-full h-12 pl-4 pr-10 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-blue-500 outline-none text-sm transition-all"
                        />
                        <Plus size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {preferences.mustGo.map((tag, index) => (
                            <span key={index} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-100">
                                {tag}
                                <button onClick={() => removeArrayItem('mustGo', index)}><X size={12} /></button>
                            </span>
                        ))}
                    </div>
                </section>

                <section>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">피하고 싶은 곳</h3>
                    <div className="relative mb-4">
                        <input
                            type="text"
                            value={mustAvoidInput}
                            onChange={(e) => setMustAvoidInput(e.target.value)}
                            onKeyDown={(e) => handleAddTag(e, 'avoid')}
                            placeholder="키워드를 입력하고 Enter"
                            className="w-full h-12 pl-4 pr-10 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-red-500 outline-none text-sm transition-all"
                        />
                        <Plus size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {preferences.mustAvoid.map((tag, index) => (
                            <span key={index} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-bold border border-red-100">
                                {tag}
                                <button onClick={() => removeArrayItem('mustAvoid', index)}><X size={12} /></button>
                            </span>
                        ))}
                    </div>
                </section>
            </div>

            {/* 활동 시간대 */}
            <section>
                <h3 className="text-lg font-bold text-gray-900 mb-6">주요 활동 시간대</h3>
                <div className="flex gap-8">
                    {timeOptions.map((time) => (
                        <label key={time} className="flex items-center gap-3 cursor-pointer group">
                            <button
                                onClick={() => toggleArrayItem('activeTimes', time)}
                                className="focus:outline-none"
                            >
                                {preferences.activeTimes.includes(time) ? (
                                    <CheckSquare size={24} className="text-gray-900" />
                                ) : (
                                    <Square size={24} className="text-gray-200 group-hover:text-gray-300" />
                                )}
                            </button>
                            <span className="text-base font-bold text-gray-700">{time}</span>
                        </label>
                    ))}
                </div>
            </section>

            {/* 자유 코멘트 */}
            <section>
                <h3 className="text-lg font-bold text-gray-900 mb-4">추가 코멘트</h3>
                <textarea
                    value={preferences.freeText}
                    onChange={(e) => updatePreference('freeText', e.target.value)}
                    placeholder="예: 뚜벅이 여행이라 이동 동선이 짧았으면 좋겠어요."
                    className="w-full h-32 p-5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-gray-200 outline-none text-sm resize-none transition-all"
                />
            </section>
        </div>
    );
}