const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081/api";
const FILE_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

/**
 * 백엔드가 반환한 첨부/프로필 이미지 URL을 실제로 접근 가능한 절대 URL로 변환한다.
 * - 로컬 디스크 저장(FileStorageService: local) 시에는 "/uploads/..." 같은 상대 경로가 오므로
 *   백엔드 오리진(FILE_ORIGIN)을 붙여야 한다.
 * - S3 저장(FileStorageService: s3) 시에는 이미 "https://..." 절대 URL이 오므로 그대로 사용한다.
 */
export function resolveFileUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${FILE_ORIGIN}${url}`;
}
