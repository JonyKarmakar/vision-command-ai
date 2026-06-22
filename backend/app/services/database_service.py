import os


def get_database_url():
    return os.getenv("DATABASE_URL")


def initialize_media_files_table():
    import psycopg

    database_url = get_database_url()

    if not database_url:
        return False

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS media_files (
                    id SERIAL PRIMARY KEY,
                    original_filename TEXT,
                    stored_filename TEXT,
                    content_type TEXT,
                    width INTEGER,
                    height INTEGER,
                    storage_path TEXT,
                    file_url TEXT,
                    created_at TEXT
                );
                """
            )

            cursor.execute("ALTER TABLE media_files ADD COLUMN IF NOT EXISTS original_filename TEXT;")
            cursor.execute("ALTER TABLE media_files ADD COLUMN IF NOT EXISTS stored_filename TEXT;")
            cursor.execute("ALTER TABLE media_files ADD COLUMN IF NOT EXISTS content_type TEXT;")
            cursor.execute("ALTER TABLE media_files ADD COLUMN IF NOT EXISTS width INTEGER;")
            cursor.execute("ALTER TABLE media_files ADD COLUMN IF NOT EXISTS height INTEGER;")
            cursor.execute("ALTER TABLE media_files ADD COLUMN IF NOT EXISTS storage_path TEXT;")
            cursor.execute("ALTER TABLE media_files ADD COLUMN IF NOT EXISTS file_url TEXT;")
            cursor.execute("ALTER TABLE media_files ADD COLUMN IF NOT EXISTS created_at TEXT;")

        connection.commit()

    return True



def save_media_file_to_database(media_data: dict, created_at: str):
    import psycopg

    database_url = get_database_url()

    if not database_url:
        return False

    initialize_media_files_table()

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO media_files (
                    original_filename,
                    stored_filename,
                    content_type,
                    width,
                    height,
                    storage_path,
                    file_url,
                    created_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s);
                """,
                (
                    media_data["original_filename"],
                    media_data["stored_filename"],
                    media_data["content_type"],
                    media_data["width"],
                    media_data["height"],
                    media_data["storage_path"],
                    media_data["file_url"],
                    created_at,
                ),
            )
        connection.commit()

    return True


def get_database_media_files(limit: int = 20):
    import psycopg

    database_url = get_database_url()

    if not database_url:
        return {
            "status": "not_configured",
            "count": 0,
            "media_files": [],
        }

    initialize_media_files_table()

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    COALESCE(original_filename, stored_filename, 'unknown') AS original_filename,
                    COALESCE(stored_filename, original_filename, 'unknown') AS stored_filename,
                    COALESCE(content_type, 'application/octet-stream') AS content_type,
                    COALESCE(width, 0) AS width,
                    COALESCE(height, 0) AS height,
                    COALESCE(storage_path, '') AS storage_path,
                    COALESCE(file_url, '') AS file_url,
                    COALESCE(created_at, '') AS created_at
                FROM media_files
                ORDER BY created_at DESC NULLS LAST
                LIMIT %s;
                """,
                (limit,),
            )
            rows = cursor.fetchall()

    media_files = [
        {
            "original_filename": row[0],
            "stored_filename": row[1],
            "content_type": row[2],
            "width": row[3],
            "height": row[4],
            "storage_path": row[5],
            "file_url": row[6],
            "created_at": row[7],
        }
        for row in rows
    ]

    return {
        "status": "healthy",
        "count": len(media_files),
        "media_files": media_files,
    }



def initialize_command_logs_table():
    import psycopg

    database_url = get_database_url()

    if not database_url:
        return False

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS command_logs (
                    id SERIAL PRIMARY KEY,
                    timestamp TEXT NOT NULL,
                    filename TEXT NOT NULL,
                    command TEXT NOT NULL,
                    confidence_threshold DOUBLE PRECISION NOT NULL,
                    parsed_action TEXT NOT NULL,
                    parsed_class TEXT,
                    result_type TEXT NOT NULL,
                    parser_mode TEXT,
                    parser_type TEXT,
                    parser_version TEXT
                );
                """
            )
            cursor.execute("ALTER TABLE command_logs ADD COLUMN IF NOT EXISTS parser_mode TEXT;")
            cursor.execute("ALTER TABLE command_logs ADD COLUMN IF NOT EXISTS parser_type TEXT;")
            cursor.execute("ALTER TABLE command_logs ADD COLUMN IF NOT EXISTS parser_version TEXT;")
        connection.commit()

    return True


def save_command_log_to_database(log_entry: dict):
    import psycopg

    database_url = get_database_url()

    if not database_url:
        return False

    initialize_command_logs_table()

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO command_logs (
                    timestamp,
                    filename,
                    command,
                    confidence_threshold,
                    parsed_action,
                    parsed_class,
                    result_type,
                    parser_mode,
                    parser_type,
                    parser_version
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                """,
                (
                    log_entry["timestamp"],
                    log_entry["filename"],
                    log_entry["command"],
                    log_entry["confidence_threshold"],
                    log_entry["parsed_action"],
                    log_entry["parsed_class"],
                    log_entry["result_type"],
                    log_entry.get("parser_mode"),
                    log_entry.get("parser_type"),
                    log_entry.get("parser_version"),
                ),
            )
        connection.commit()

    return True


def get_database_command_logs(limit: int = 20, parser_mode=None, result_type=None):
    import psycopg

    database_url = get_database_url()

    if not database_url:
        return {
            "status": "not_configured",
            "count": 0,
            "logs": [],
        }

    initialize_command_logs_table()

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            query_params = []
            where_clauses = []

            if parser_mode:
                where_clauses.append("parser_mode = %s")
                query_params.append(parser_mode)

            if result_type:
                where_clauses.append("result_type = %s")
                query_params.append(result_type)

            filter_clause = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""

            query_params.append(limit)

            cursor.execute(
                f"""
                SELECT
                    timestamp,
                    filename,
                    command,
                    confidence_threshold,
                    parsed_action,
                    parsed_class,
                    result_type,
                    parser_mode,
                    parser_type,
                    parser_version
                FROM command_logs
                {filter_clause}
                ORDER BY id DESC
                LIMIT %s;
                """,
                tuple(query_params),
            )
            rows = cursor.fetchall()

    logs = [
        {
            "timestamp": row[0],
            "filename": row[1],
            "command": row[2],
            "confidence_threshold": row[3],
            "parsed_action": row[4],
            "parsed_class": row[5],
            "result_type": row[6],
            "parser_mode": row[7],
            "parser_type": row[8],
            "parser_version": row[9],
        }
        for row in rows
    ]

    return {
        "status": "healthy",
        "count": len(logs),
        "logs": logs,
    }



def get_database_command_log_summary(parser_mode=None, result_type=None):
    import psycopg

    database_url = get_database_url()

    if not database_url:
        return {
            "status": "not_configured",
            "total_commands": 0,
            "by_parser_mode": [],
            "by_result_type": [],
            "by_parsed_action": [],
        }

    initialize_command_logs_table()

    where_clauses = []
    params = []

    if parser_mode:
        where_clauses.append("parser_mode = %s")
        params.append(parser_mode)

    if result_type:
        where_clauses.append("result_type = %s")
        params.append(result_type)

    where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(f"SELECT COUNT(*) FROM command_logs {where_sql};", params)
            total_commands = cursor.fetchone()[0]

            cursor.execute(
                f"""
                SELECT
                    COALESCE(parser_mode, 'unknown') AS parser_mode,
                    COUNT(*) AS command_count
                FROM command_logs
                {where_sql}
                GROUP BY COALESCE(parser_mode, 'unknown')
                ORDER BY command_count DESC, parser_mode ASC;
                """,
                params,
            )
            parser_mode_rows = cursor.fetchall()

            cursor.execute(
                f"""
                SELECT
                    result_type,
                    COUNT(*) AS command_count
                FROM command_logs
                {where_sql}
                GROUP BY result_type
                ORDER BY command_count DESC, result_type ASC;
                """,
                params,
            )
            result_type_rows = cursor.fetchall()

            cursor.execute(
                f"""
                SELECT
                    parsed_action,
                    COUNT(*) AS command_count
                FROM command_logs
                {where_sql}
                GROUP BY parsed_action
                ORDER BY command_count DESC, parsed_action ASC;
                """,
                params,
            )
            parsed_action_rows = cursor.fetchall()

    return {
        "status": "healthy",
        "total_commands": total_commands,
        "by_parser_mode": [
            {
                "name": row[0],
                "count": row[1],
            }
            for row in parser_mode_rows
        ],
        "by_result_type": [
            {
                "name": row[0],
                "count": row[1],
            }
            for row in result_type_rows
        ],
        "by_parsed_action": [
            {
                "name": row[0],
                "count": row[1],
            }
            for row in parsed_action_rows
        ],
    }


def initialize_detection_results_table():
    import psycopg

    database_url = get_database_url()

    if not database_url:
        return False

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS detection_results (
                    id SERIAL PRIMARY KEY,
                    filename TEXT NOT NULL,
                    class_id INTEGER NOT NULL,
                    class_name TEXT NOT NULL,
                    confidence DOUBLE PRECISION NOT NULL,
                    bbox_x1 DOUBLE PRECISION NOT NULL,
                    bbox_y1 DOUBLE PRECISION NOT NULL,
                    bbox_x2 DOUBLE PRECISION NOT NULL,
                    bbox_y2 DOUBLE PRECISION NOT NULL,
                    confidence_threshold DOUBLE PRECISION NOT NULL,
                    class_filter TEXT,
                    source_endpoint TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );
                """
            )
        connection.commit()

    return True


def save_detections_to_database(
    filename: str,
    detections: list,
    confidence_threshold: float,
    class_filter,
    source_endpoint: str,
):
    import psycopg
    from datetime import datetime, timezone

    database_url = get_database_url()

    if not database_url:
        return False

    initialize_detection_results_table()

    created_at = datetime.now(timezone.utc).isoformat()

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            for detection in detections:
                bbox = detection["bbox"]

                cursor.execute(
                    """
                    INSERT INTO detection_results (
                        filename,
                        class_id,
                        class_name,
                        confidence,
                        bbox_x1,
                        bbox_y1,
                        bbox_x2,
                        bbox_y2,
                        confidence_threshold,
                        class_filter,
                        source_endpoint,
                        created_at
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                    """,
                    (
                        filename,
                        detection["class_id"],
                        detection["class_name"],
                        detection["confidence"],
                        bbox["x1"],
                        bbox["y1"],
                        bbox["x2"],
                        bbox["y2"],
                        confidence_threshold,
                        class_filter,
                        source_endpoint,
                        created_at,
                    ),
                )
        connection.commit()

    return True


def get_database_detection_results(limit: int = 20):
    import psycopg

    database_url = get_database_url()

    if not database_url:
        return {
            "status": "not_configured",
            "count": 0,
            "detections": [],
        }

    initialize_detection_results_table()

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    filename,
                    class_id,
                    class_name,
                    confidence,
                    bbox_x1,
                    bbox_y1,
                    bbox_x2,
                    bbox_y2,
                    confidence_threshold,
                    class_filter,
                    source_endpoint,
                    created_at
                FROM detection_results
                ORDER BY id DESC
                LIMIT %s;
                """,
                (limit,),
            )
            rows = cursor.fetchall()

    detections = [
        {
            "filename": row[0],
            "class_id": row[1],
            "class_name": row[2],
            "confidence": row[3],
            "bbox": {
                "x1": row[4],
                "y1": row[5],
                "x2": row[6],
                "y2": row[7],
            },
            "confidence_threshold": row[8],
            "class_filter": row[9],
            "source_endpoint": row[10],
            "created_at": row[11],
        }
        for row in rows
    ]

    return {
        "status": "healthy",
        "count": len(detections),
        "detections": detections,
    }


def get_database_detection_summary():
    import psycopg

    database_url = get_database_url()

    if not database_url:
        return {
            "status": "not_configured",
            "total_detections": 0,
            "classes": [],
        }

    initialize_detection_results_table()

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM detection_results;")
            total_detections = cursor.fetchone()[0]

            cursor.execute(
                """
                SELECT
                    class_name,
                    COUNT(*) AS detection_count,
                    AVG(confidence) AS average_confidence,
                    MAX(confidence) AS max_confidence
                FROM detection_results
                GROUP BY class_name
                ORDER BY detection_count DESC, class_name ASC;
                """
            )
            rows = cursor.fetchall()

    classes = [
        {
            "class_name": row[0],
            "count": row[1],
            "average_confidence": round(float(row[2]), 4),
            "max_confidence": round(float(row[3]), 4),
        }
        for row in rows
    ]

    return {
        "status": "healthy",
        "total_detections": total_detections,
        "classes": classes,
    }


def initialize_model_inference_logs_table():
    import psycopg

    database_url = get_database_url()

    if not database_url:
        return False

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS model_inference_logs (
                    id SERIAL PRIMARY KEY,
                    filename TEXT NOT NULL,
                    model_name TEXT NOT NULL,
                    source_endpoint TEXT NOT NULL,
                    confidence_threshold DOUBLE PRECISION NOT NULL,
                    class_filter TEXT,
                    detection_count INTEGER NOT NULL,
                    inference_time_ms DOUBLE PRECISION NOT NULL,
                    created_at TEXT NOT NULL
                );
                """
            )
        connection.commit()

    return True


def save_inference_log_to_database(
    filename: str,
    model_name: str,
    source_endpoint: str,
    confidence_threshold: float,
    class_filter,
    detection_count: int,
    inference_time_ms: float,
):
    import psycopg
    from datetime import datetime, timezone

    database_url = get_database_url()

    if not database_url:
        return False

    initialize_model_inference_logs_table()

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO model_inference_logs (
                    filename,
                    model_name,
                    source_endpoint,
                    confidence_threshold,
                    class_filter,
                    detection_count,
                    inference_time_ms,
                    created_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s);
                """,
                (
                    filename,
                    model_name,
                    source_endpoint,
                    confidence_threshold,
                    class_filter,
                    detection_count,
                    inference_time_ms,
                    datetime.now(timezone.utc).isoformat(),
                ),
            )
        connection.commit()

    return True


def get_database_inference_logs(limit: int = 20):
    import psycopg

    database_url = get_database_url()

    if not database_url:
        return {
            "status": "not_configured",
            "count": 0,
            "inference_logs": [],
        }

    initialize_model_inference_logs_table()

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    filename,
                    model_name,
                    source_endpoint,
                    confidence_threshold,
                    class_filter,
                    detection_count,
                    inference_time_ms,
                    created_at
                FROM model_inference_logs
                ORDER BY id DESC
                LIMIT %s;
                """,
                (limit,),
            )
            rows = cursor.fetchall()

    inference_logs = [
        {
            "filename": row[0],
            "model_name": row[1],
            "source_endpoint": row[2],
            "confidence_threshold": row[3],
            "class_filter": row[4],
            "detection_count": row[5],
            "inference_time_ms": row[6],
            "created_at": row[7],
        }
        for row in rows
    ]

    return {
        "status": "healthy",
        "count": len(inference_logs),
        "inference_logs": inference_logs,
    }


def get_database_inference_summary():
    import psycopg

    database_url = get_database_url()

    if not database_url:
        return {
            "status": "not_configured",
            "total_inferences": 0,
            "average_inference_time_ms": 0,
            "max_inference_time_ms": 0,
            "total_detections": 0,
            "average_detections_per_run": 0,
            "by_endpoint": [],
        }

    initialize_model_inference_logs_table()

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    COUNT(*) AS total_inferences,
                    COALESCE(AVG(inference_time_ms), 0) AS average_inference_time_ms,
                    COALESCE(MAX(inference_time_ms), 0) AS max_inference_time_ms,
                    COALESCE(SUM(detection_count), 0) AS total_detections,
                    COALESCE(AVG(detection_count), 0) AS average_detections_per_run
                FROM model_inference_logs;
                """
            )
            summary_row = cursor.fetchone()

            cursor.execute(
                """
                SELECT
                    source_endpoint,
                    COUNT(*) AS run_count,
                    COALESCE(AVG(inference_time_ms), 0) AS average_inference_time_ms,
                    COALESCE(MAX(inference_time_ms), 0) AS max_inference_time_ms,
                    COALESCE(SUM(detection_count), 0) AS total_detections
                FROM model_inference_logs
                GROUP BY source_endpoint
                ORDER BY run_count DESC, source_endpoint ASC;
                """
            )
            endpoint_rows = cursor.fetchall()

    by_endpoint = [
        {
            "source_endpoint": row[0],
            "run_count": row[1],
            "average_inference_time_ms": round(float(row[2]), 2),
            "max_inference_time_ms": round(float(row[3]), 2),
            "total_detections": row[4],
        }
        for row in endpoint_rows
    ]

    return {
        "status": "healthy",
        "total_inferences": summary_row[0],
        "average_inference_time_ms": round(float(summary_row[1]), 2),
        "max_inference_time_ms": round(float(summary_row[2]), 2),
        "total_detections": summary_row[3],
        "average_detections_per_run": round(float(summary_row[4]), 2),
        "by_endpoint": by_endpoint,
    }



def initialize_generated_outputs_table():
    import psycopg

    database_url = get_database_url()

    if not database_url:
        return False

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS generated_outputs (
                    id TEXT PRIMARY KEY,
                    action TEXT NOT NULL,
                    label TEXT,
                    filename TEXT NOT NULL,
                    file_url TEXT NOT NULL,
                    source TEXT,
                    source_filename TEXT,
                    created_by TEXT,
                    command_text TEXT,
                    result_type TEXT,
                    execution_mode TEXT,
                    parser_mode TEXT,
                    parser_type TEXT,
                    planner_mode TEXT,
                    created_at TEXT NOT NULL
                );
                """
            )

            cursor.execute("ALTER TABLE generated_outputs ADD COLUMN IF NOT EXISTS id TEXT;")
            cursor.execute("ALTER TABLE generated_outputs ADD COLUMN IF NOT EXISTS action TEXT;")
            cursor.execute("ALTER TABLE generated_outputs ADD COLUMN IF NOT EXISTS label TEXT;")
            cursor.execute("ALTER TABLE generated_outputs ADD COLUMN IF NOT EXISTS filename TEXT;")
            cursor.execute("ALTER TABLE generated_outputs ADD COLUMN IF NOT EXISTS file_url TEXT;")
            cursor.execute("ALTER TABLE generated_outputs ADD COLUMN IF NOT EXISTS source TEXT;")
            cursor.execute("ALTER TABLE generated_outputs ADD COLUMN IF NOT EXISTS source_filename TEXT;")
            cursor.execute("ALTER TABLE generated_outputs ADD COLUMN IF NOT EXISTS created_by TEXT;")
            cursor.execute("ALTER TABLE generated_outputs ADD COLUMN IF NOT EXISTS command_text TEXT;")
            cursor.execute("ALTER TABLE generated_outputs ADD COLUMN IF NOT EXISTS result_type TEXT;")
            cursor.execute("ALTER TABLE generated_outputs ADD COLUMN IF NOT EXISTS execution_mode TEXT;")
            cursor.execute("ALTER TABLE generated_outputs ADD COLUMN IF NOT EXISTS parser_mode TEXT;")
            cursor.execute("ALTER TABLE generated_outputs ADD COLUMN IF NOT EXISTS parser_type TEXT;")
            cursor.execute("ALTER TABLE generated_outputs ADD COLUMN IF NOT EXISTS planner_mode TEXT;")
            cursor.execute("ALTER TABLE generated_outputs ADD COLUMN IF NOT EXISTS created_at TEXT;")

        connection.commit()

    return True


def save_generated_output_to_database(output_item: dict):
    import psycopg

    database_url = get_database_url()

    if not database_url:
        return {
            "status": "not_configured",
            "saved": False,
            "generated_output": output_item,
        }

    initialize_generated_outputs_table()

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO generated_outputs (
                    id,
                    action,
                    label,
                    filename,
                    file_url,
                    source,
                    source_filename,
                    created_by,
                    command_text,
                    result_type,
                    execution_mode,
                    parser_mode,
                    parser_type,
                    planner_mode,
                    created_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    action = EXCLUDED.action,
                    label = EXCLUDED.label,
                    filename = EXCLUDED.filename,
                    file_url = EXCLUDED.file_url,
                    source = EXCLUDED.source,
                    source_filename = EXCLUDED.source_filename,
                    created_by =                    created_by,
                    command_text,
                    result_type,
                    execution_mode,
                    parser_mode,
                    parser_type,
                    planner_mode,
                    created_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    action = EXCLUDED.action,
                    label = EXCLUDED.label,
                    filename = EXCLUDED.created_by,
                    command_text = EXCLUDED.command_text,
                    result_type = EXCLUDED.result_type,
                    execution_mode = EXCLUDED.execution_mode,
                    parser_mode = EXCLUDED.parser_mode,
                    parser_type = EXCLUDED.parser_type,
                    planner_mode = EXCLUDED.planner_mode,
                    created_at = EXCLUDED.created_at;
                """,
                (
                    output_item["id"],
                    output_item["action"],
                    output_item.get("label"),
                    output_item["filename"],
                    output_item["file_url"],
                    output_item.get("source"),
                    output_item.get("source_filename"),
                    output_item.get("created_by"),
                    output_item.get("command_text"),
                    output_item.get("result_type"),
                    output_item.get("execution_mode"),
                    output_item.get("parser_mode"),
                    output_item.get("parser_type"),
                    output_item.get("planner_mode"),
                    output_item["created_at"],
                ),
            )

        connection.commit()

    return {
        "status": "healthy",
        "saved": True,
        "generated_output": output_item,
    }


def get_database_generated_outputs(limit: int = 100):
    import psycopg

    database_url = get_database_url()

    if not database_url:
        return {
            "status": "not_configured",
            "count": 0,
            "generated_outputs": [],
        }

    initialize_generated_outputs_table()

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    id,
                    action,
                    COALESCE(label, '') AS label,
                    filename,
                    file_url,
                    source,
                    source_filename,
                    created_by,
                    command_text,
                    result_type,
                    execution_mode,
                    parser_mode,
                    parser_type,
                    planner_mode,
                    created_at
                FROM generated_outputs
                ORDER BY created_at DESC NULLS LAST
                LIMIT %s;
                """,
                (limit,),
            )
            rows = cursor.fetchall()

    generated_outputs = [
        {
            "id": row[0],
            "action": row[1],
            "label": row[2],
            "filename": row[3],
            "file_url": row[4],
            "source": row[5],
            "source_filename": row[6],
            "created_by": row[7],
            "command_text": row[8],
            "result_type": row[9],
            "execution_mode": row[10],
            "parser_mode": row[11],
            "parser_type": row[12],
            "planner_mode": row[13],
            "created_at": row[14],
        }
        for row in rows
    ]

    return {
        "status": "healthy",
        "count": len(generated_outputs),
        "generated_outputs": generated_outputs,
    }


def delete_database_generated_output(output_id: str):
    import psycopg

    database_url = get_database_url()

    if not database_url:
        return {
            "status": "not_configured",
            "deleted": False,
            "id": output_id,
        }

    initialize_generated_outputs_table()

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                "DELETE FROM generated_outputs WHERE id = %s;",
                (output_id,),
            )
            deleted = cursor.rowcount > 0

        connection.commit()

    return {
        "status": "healthy",
        "deleted": deleted,
        "id": output_id,
    }


def clear_database_generated_outputs():
    import psycopg

    database_url = get_database_url()

    if not database_url:
        return {
            "status": "not_configured",
            "deleted_count": 0,
        }

    initialize_generated_outputs_table()

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM generated_outputs;")
            deleted_count = cursor.rowcount

        connection.commit()

    return {
        "status": "healthy",
        "deleted_count": deleted_count,
    }


def get_database_stats():
    import psycopg

    database_url = get_database_url()

    if not database_url:
        return {
            "status": "not_configured",
            "media_files_count": 0,
            "command_logs_count": 0,
            "generated_outputs_count": 0,
        }

    initialize_media_files_table()
    initialize_command_logs_table()
    initialize_generated_outputs_table()

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM media_files;")
            media_files_count = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM command_logs;")
            command_logs_count = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM generated_outputs;")
            generated_outputs_count = cursor.fetchone()[0]

    return {
        "status": "healthy",
        "media_files_count": media_files_count,
        "command_logs_count": command_logs_count,
        "generated_outputs_count": generated_outputs_count,
    }


def initialize_parser_attempt_logs_table():
    import psycopg

    database_url = get_database_url()

    if not database_url:
        return False

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS parser_attempt_logs (
                    id SERIAL PRIMARY KEY,
                    timestamp TEXT NOT NULL,
                    command TEXT NOT NULL,
                    parser_mode TEXT NOT NULL,
                    parser_type TEXT,
                    parser_version TEXT,
                    success BOOLEAN NOT NULL,
                    latency_ms DOUBLE PRECISION NOT NULL,
                    parsed_command TEXT,
                    error TEXT
                );
                """
            )
        connection.commit()

    return True


def save_parser_attempt_to_database(log_entry: dict):
    import json
    import psycopg

    database_url = get_database_url()

    if not database_url:
        return False

    initialize_parser_attempt_logs_table()

    parsed_command = log_entry.get("parsed_command")
    parsed_command_json = json.dumps(parsed_command) if parsed_command is not None else None

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO parser_attempt_logs (
                    timestamp,
                    command,
                    parser_mode,
                    parser_type,
                    parser_version,
                    success,
                    latency_ms,
                    parsed_command,
                    error
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);
                """,
                (
                    log_entry["timestamp"],
                    log_entry["command"],
                    log_entry["parser_mode"],
                    log_entry.get("parser_type"),
                    log_entry.get("parser_version"),
                    log_entry["success"],
                    log_entry["latency_ms"],
                    parsed_command_json,
                    log_entry.get("error"),
                ),
            )
        connection.commit()

    return True


def get_database_parser_attempt_logs(
    limit: int = 20,
    parser_mode=None,
    success=None,
):
    import json
    import psycopg

    database_url = get_database_url()

    if not database_url:
        return {
            "status": "not_configured",
            "count": 0,
            "logs": [],
        }

    initialize_parser_attempt_logs_table()

    where_clauses = []
    params = []

    if parser_mode:
        where_clauses.append("parser_mode = %s")
        params.append(parser_mode)

    if success is not None:
        where_clauses.append("success = %s")
        params.append(success)

    where_sql = ""
    if where_clauses:
        where_sql = "WHERE " + " AND ".join(where_clauses)

    params.append(limit)

    query = f"""
        SELECT
            timestamp,
            command,
            parser_mode,
            parser_type,
            parser_version,
            success,
            latency_ms,
            parsed_command,
            error
        FROM parser_attempt_logs
        {where_sql}
        ORDER BY id DESC
        LIMIT %s;
    """

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(query, tuple(params))
            rows = cursor.fetchall()

    logs = []

    for row in rows:
        parsed_command = json.loads(row[7]) if row[7] else None

        logs.append(
            {
                "timestamp": row[0],
                "command": row[1],
                "parser_mode": row[2],
                "parser_type": row[3],
                "parser_version": row[4],
                "success": row[5],
                "latency_ms": row[6],
                "parsed_command": parsed_command,
                "error": row[8],
            }
        )

    return {
        "status": "healthy",
        "count": len(logs),
        "logs": logs,
    }


def get_database_parser_attempt_summary(
    parser_mode=None,
    success=None,
):
    import psycopg

    database_url = get_database_url()

    if not database_url:
        return {
            "status": "not_configured",
            "total_attempts": 0,
            "successful_attempts": 0,
            "failed_attempts": 0,
            "success_rate": 0,
            "average_latency_ms": 0,
            "by_parser_mode": [],
            "by_parser_type": [],
            "by_error": [],
        }

    initialize_parser_attempt_logs_table()

    where_clauses = []
    params = []

    if parser_mode:
        where_clauses.append("parser_mode = %s")
        params.append(parser_mode)

    if success is not None:
        where_clauses.append("success = %s")
        params.append(success)

    where_sql = ""
    if where_clauses:
        where_sql = "WHERE " + " AND ".join(where_clauses)

    error_where_clauses = where_clauses + [
        "error IS NOT NULL",
        "error <> ''",
    ]
    error_where_sql = "WHERE " + " AND ".join(error_where_clauses)

    query_params = tuple(params)

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                f"""
                SELECT
                    COUNT(*) AS total_attempts,
                    COALESCE(SUM(CASE WHEN success THEN 1 ELSE 0 END), 0) AS successful_attempts,
                    COALESCE(SUM(CASE WHEN success THEN 0 ELSE 1 END), 0) AS failed_attempts,
                    COALESCE(AVG(latency_ms), 0) AS average_latency_ms
                FROM parser_attempt_logs
                {where_sql};
                """,
                query_params,
            )
            total_attempts, successful_attempts, failed_attempts, average_latency_ms = cursor.fetchone()

            cursor.execute(
                f"""
                SELECT
                    parser_mode,
                    COUNT(*) AS attempts,
                    COALESCE(SUM(CASE WHEN success THEN 1 ELSE 0 END), 0) AS successful_attempts,
                    COALESCE(SUM(CASE WHEN success THEN 0 ELSE 1 END), 0) AS failed_attempts,
                    COALESCE(AVG(latency_ms), 0) AS average_latency_ms
                FROM parser_attempt_logs
                {where_sql}
                GROUP BY parser_mode
                ORDER BY attempts DESC, parser_mode ASC;
                """,
                query_params,
            )
            parser_mode_rows = cursor.fetchall()

            cursor.execute(
                f"""
                SELECT
                    COALESCE(parser_type, 'unknown') AS parser_type,
                    COUNT(*) AS attempts,
                    COALESCE(SUM(CASE WHEN success THEN 1 ELSE 0 END), 0) AS successful_attempts,
                    COALESCE(SUM(CASE WHEN success THEN 0 ELSE 1 END), 0) AS failed_attempts,
                    COALESCE(AVG(latency_ms), 0) AS average_latency_ms
                FROM parser_attempt_logs
                {where_sql}
                GROUP BY COALESCE(parser_type, 'unknown')
                ORDER BY attempts DESC, parser_type ASC;
                """,
                query_params,
            )
            parser_type_rows = cursor.fetchall()

            cursor.execute(
                f"""
                SELECT
                    error,
                    COUNT(*) AS attempts,
                    COALESCE(AVG(latency_ms), 0) AS average_latency_ms
                FROM parser_attempt_logs
                {error_where_sql}
                GROUP BY error
                ORDER BY attempts DESC, error ASC;
                """,
                query_params,
            )
            error_rows = cursor.fetchall()

    total_attempts = int(total_attempts)
    successful_attempts = int(successful_attempts)
    failed_attempts = int(failed_attempts)

    success_rate = (
        round(successful_attempts / total_attempts, 4)
        if total_attempts > 0
        else 0
    )

    by_parser_mode = [
        {
            "parser_mode": row[0],
            "attempts": int(row[1]),
            "successful_attempts": int(row[2]),
            "failed_attempts": int(row[3]),
            "average_latency_ms": float(row[4]),
        }
        for row in parser_mode_rows
    ]

    by_parser_type = [
        {
            "parser_type": row[0],
            "attempts": int(row[1]),
            "successful_attempts": int(row[2]),
            "failed_attempts": int(row[3]),
            "average_latency_ms": float(row[4]),
        }
        for row in parser_type_rows
    ]

    by_error = [
        {
            "error": row[0],
            "attempts": int(row[1]),
            "average_latency_ms": float(row[2]),
        }
        for row in error_rows
    ]

    return {
        "status": "healthy",
        "total_attempts": total_attempts,
        "successful_attempts": successful_attempts,
        "failed_attempts": failed_attempts,
        "success_rate": success_rate,
        "average_latency_ms": float(average_latency_ms),
        "by_parser_mode": by_parser_mode,
        "by_parser_type": by_parser_type,
        "by_error": by_error,
    }
