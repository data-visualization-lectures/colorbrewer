// API_BASE_URL は dataviz-auth-client.js で定義済みのため削除
const DATAVIZ_APP_NAME = "colorbrewer";

class DatavizApiClient {
    constructor() { }

    async getSession() {
        if (!window.supabase) return null;
        const { data } = await window.supabase.auth.getSession();
        return data.session;
    }

    async fetchAuthenticated(url, options = {}) {
        const session = await this.getSession();
        if (!session) {
            throw new Error("ログインしてください");
        }

        const headers = {
            "Authorization": `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
            ...options.headers
        };

        try {
            const res = await fetch(API_BASE_URL + url, {
                ...options,
                headers
            });

            if (!res.ok) {
                const errorBody = await res.json().catch(() => ({}));
                throw new Error(errorBody.error || `エラーが発生しました: ${res.status}`);
            }

            // DELETEメソッドなどでボディがない場合のハンドリング
            if (res.status === 204) return null;

            // Content-Typeチェック
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                return res.json();
            }
            return res.text();
        } catch (err) {
            console.error("API Request Failed:", err);
            throw err;
        }
    }

    async listProjects() {
        const res = await this.fetchAuthenticated(`/api/projects?app=${DATAVIZ_APP_NAME}`);
        return res.projects;
    }

    async getProjectData(id) {
        // 実データを返す
        return this.fetchAuthenticated(`/api/projects/${id}`);
    }

    async createProject(name, data, thumbnail) {
        const body = {
            name: name,
            app_name: DATAVIZ_APP_NAME,
            data: data,
            thumbnail: thumbnail // Base64 Data URI
        };
        return this.fetchAuthenticated("/api/projects", {
            method: "POST",
            body: JSON.stringify(body)
        });
    }

    async updateProject(id, name, data, thumbnail) {
        const body = {};
        if (name) body.name = name;
        if (data) body.data = data;
        if (thumbnail) body.thumbnail = thumbnail;

        return this.fetchAuthenticated(`/api/projects/${id}`, {
            method: "PUT",
            body: JSON.stringify(body)
        });
    }

    async deleteProject(id) {
        return this.fetchAuthenticated(`/api/projects/${id}`, {
            method: "DELETE"
        });
    }

    async getThumbnailBlob(id) {
        const session = await this.getSession();
        if (!session) throw new Error("Login required");

        const res = await fetch(`${API_BASE_URL}/api/projects/${id}/thumbnail`, {
            headers: {
                "Authorization": `Bearer ${session.access_token}`
            }
        });

        if (!res.ok) {
            throw new Error(`Thumbnail error: ${res.status}`);
        }
        return res.blob();
    }
}
