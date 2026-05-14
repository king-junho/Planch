export function getDeadlineStatus(dateString?: string | null, now = Date.now()){
    if(!dateString){
        return{
            hasDeadline: false,
            passed: false,
            badgeText : "미설정",
            remainingText: "결정 마감기한이 설정되지 않았습니다.",
            countdownText: "-",
        };
    }
    const target = new Date(dateString).getTime();
    const diff = target - now;

    if(Number.isNaN(target)){
        return{
            hasDeadline: false,
            passed: false,
            badgeText : "미설정",
            remainingText : "유효하지 않은 마감기한입니다.",
            countdownText: "-",
        };
    }

    if(diff <=0){
        return {
            hasDeadline: true,
            passed:true,
            badgeText: "마감",
            remainingText: "결정 마감기한이 지났습니다.",
            countdownText: "00:00:00",
        };
    }
    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / (60 * 60 * 24));
    const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    const seconds = totalSeconds % 60;

    const countdownText =
    days > 0
      ? `${days}일 ${String(hours).padStart(2, "0")}시간 ${String(minutes).padStart(2, "0")}분 ${String(seconds).padStart(2, "0")}초`
      : `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    const remainingText = days > 0
      ? `남은 시간 ${days}일 ${hours}시간`
      : `남은 시간 ${hours}시간 ${minutes}분`;
    
    return{
        hasDeadline: true,
        passed:false,
        badgeText:"진행중",
        remainingText,
        countdownText
    };
}