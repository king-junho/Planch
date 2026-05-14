import React, { useRef, useState, useEffect } from 'react';
import { X, CheckSquare, Square, Plus, Loader2, Lock } from 'lucide-react';
import { usePreferenceStore } from '../store/usePreferenceStore';
import { getAccessToken } from '../../../services/authStorage';

interface PreferenceFormProps {
    isLocked?: boolean;
}

export default function PreferenceForm({ isLocked = false }: PreferenceFormProps) {
    const {
        formData,
        updatePreference,
        toggleArrayItem,
        addArrayItem,
        removeArrayItem,
        initializeFormWithExisting,
        teamPreferences,
        isLoading
    } = usePreferenceStore();

    const [mustGoInput, setMustGoInput] = useState('');
    const [mustAvoidInput, setMustAvoidInput] = useState('');
    const isComposingRef = useRef(false);

    const styleOptions = ['맛집', '카페', '관광', '휴식', '사진스팟', '쇼핑', '액티비티'];
    const timeOptions = ['오전', '오후', '저녁'];

    const isDisabled = isLoading || isLocked;

    useEffect(() => {
        if (teamPreferences.length > 0) {
            const token = getAccessToken();

            if (token) {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    const myUserId = payload.userId || payload.id || payload.sub;

                    if (myUserId) {
                        initializeFormWithExisting(myUserId);
                    }
                } catch (error) {
                    console.error("토큰 디코딩 실패:", error);
                }
            }
        }
    }, [teamPreferences, initializeFormWithExisting]);

    const handleAddTag = (e: React.KeyboardEvent, type: 'go' | 'avoid') => {
        if (e.key === 'Enter' && !isComposingRef.current && !e.nativeEvent.isComposing) {
            e.preventDefault();
            if (isDisabled) return;

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
        <div className="flex flex-col gap-12 relative min-h-[400px] w-full pb-20">
            {isLoading && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm rounded-xl">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-2" />
                    <span className="text-sm font-bold text-gray-700">정보를 처리하는 중입니다...</span>
                </div>
            )}

            {isLocked && (
                <div className="flex items-center gap-2 p-4 bg-gray-100 border border-gray-200 rounded-xl text-gray-600">
                    <Lock size={16} />
                    <span className="text-sm font-bold">여행이 확정되어 더 이상 선호도를 수정할 수 없습니다.</span>
                </div>
            )}

            <section>
                <div className="flex justify-between items-end mb-6">
                    <h3 className="text-lg font-bold text-gray-900">여행 예산 (1인 기준)</h3>
                    <span className="text-blue-600 font-bold text-xl">
                        {formData.budgetMax >= 1000000 ? '100만원+' : `${(formData.budgetMax / 10000).toLocaleString()}만원 이하`}
                    </span>
                </div>
                <input
                    type="range"
                    min="50000"
                    max="1000000"
                    step="50000"
                    value={formData.budgetMax}
                    onChange={(e) => updatePreference('budgetMax', Number(e.target.value))}
                    disabled={isDisabled}
                    className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div className="flex justify-between mt-3 text-[10px] font-bold text-gray-300 px-1">
                    <span>5만원</span>
                    <span>50만원</span>
                    <span>100만원+</span>
                </div>
            </section>

            <section>
                <h3 className="text-lg font-bold text-gray-900 mb-6">여행 스타일</h3>
                <div className="flex flex-wrap gap-2">
                    {styleOptions.map((style) => (
                        <button
                            key={style}
                            onClick={() => toggleArrayItem('styles', style)}
                            disabled={isDisabled}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${formData.styles.includes(style)
                                ? 'bg-gray-900 text-white shadow-md'
                                : 'bg-white text-gray-400 border border-gray-100 hover:border-gray-200'
                                }`}
                        >
                            {style}
                        </button>
                    ))}
                </div>
            </section>

            <div className="grid grid-cols-2 gap-8">
                <section>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">꼭 가고 싶은 곳</h3>
                    <div className="relative mb-4">
                        <input
                            type="text"
                            value={mustGoInput}
                            onChange={(e) => setMustGoInput(e.target.value)}
                            onKeyDown={(e) => handleAddTag(e, 'go')}
                            onCompositionStart={() => { isComposingRef.current = true; }}
                            onCompositionEnd={() => { isComposingRef.current = false; }}
                            disabled={isDisabled}
                            placeholder="장소를 입력하고 Enter"
                            className="w-full h-12 pl-4 pr-10 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-blue-500 outline-none text-sm transition-all disabled:opacity-50 disabled:bg-gray-100"
                        />
                        <Plus size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {formData.mustGo.map((tag, index) => (
                            <span key={index} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-100">
                                {tag}
                                <button onClick={() => removeArrayItem('mustGo', index)} disabled={isDisabled} className="disabled:opacity-50 disabled:cursor-not-allowed"><X size={12} /></button>
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
                            onCompositionStart={() => { isComposingRef.current = true; }}
                            onCompositionEnd={() => { isComposingRef.current = false; }}
                            disabled={isDisabled}
                            placeholder="키워드를 입력하고 Enter"
                            className="w-full h-12 pl-4 pr-10 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-red-500 outline-none text-sm transition-all disabled:opacity-50 disabled:bg-gray-100"
                        />
                        <Plus size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {formData.mustAvoid.map((tag, index) => (
                            <span key={index} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-bold border border-red-100">
                                {tag}
                                <button onClick={() => removeArrayItem('mustAvoid', index)} disabled={isDisabled} className="disabled:opacity-50 disabled:cursor-not-allowed"><X size={12} /></button>
                            </span>
                        ))}
                    </div>
                </section>
            </div>

            <section>
                <h3 className="text-lg font-bold text-gray-900 mb-6">주요 활동 시간대</h3>
                <div className="flex gap-4 flex-wrap">
                    {timeOptions.map((time) => (
                        <button
                            key={time}
                            onClick={() => toggleArrayItem('activeTimes', time)}
                            disabled={isDisabled}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl group transition-all outline-none border border-transparent shrink-0 ${isDisabled
                                ? 'cursor-not-allowed opacity-50'
                                : 'cursor-pointer hover:bg-gray-50 hover:border-gray-100'
                                }`}
                        >
                            {formData.activeTimes.includes(time) ? (
                                <CheckSquare size={24} className="text-gray-900 shrink-0" />
                            ) : (
                                <Square size={24} className={`text-gray-200 shrink-0 ${!isDisabled && 'group-hover:text-gray-300'}`} />
                            )}
                            <span className="text-base font-bold text-gray-700 whitespace-nowrap">{time}</span>
                        </button>
                    ))}
                </div>
            </section>

            <section>
                <h3 className="text-lg font-bold text-gray-900 mb-4">추가 코멘트</h3>
                <textarea
                    value={formData.freeText}
                    onChange={(e) => updatePreference('freeText', e.target.value)}
                    disabled={isDisabled}
                    placeholder="예: 뚜벅이 여행이라 이동 동선이 짧았으면 좋겠어요."
                    className="w-full h-32 p-5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-gray-200 outline-none text-sm resize-none transition-all disabled:opacity-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
            </section>
        </div>
    );
}
