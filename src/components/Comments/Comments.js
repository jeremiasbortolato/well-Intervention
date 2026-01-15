import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableHead, TableRow, TableCell, TableContainer } from '@corva/ui/components';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';

import styles from './Comments.css';

function Comments({ comments = [], isLoading = false }) {
  const [sortColumn, setSortColumn] = useState('time');
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' or 'desc'

  const handleSort = (column) => {
    if (sortColumn === column) {
      // Toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getTimeValue = (value) => {
    if (!value) return 0;
    if (value instanceof Date) return value.getTime();
    const parsed = new Date(value);
    const parsedValue = parsed.getTime();
    return Number.isNaN(parsedValue) ? 0 : parsedValue;
  };

  const sortedComments = useMemo(() => {
    const sorted = [...comments];
    
    sorted.sort((a, b) => {
      let aValue, bValue;

      switch (sortColumn) {
        case 'name':
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
          break;
        case 'time':
          aValue = getTimeValue(a.time);
          bValue = getTimeValue(b.time);
          break;
        case 'comment':
          aValue = (a.comment || '').toLowerCase();
          bValue = (b.comment || '').toLowerCase();
          break;
        case 'attachments':
          aValue = Array.isArray(a.attachments) ? a.attachments.length : 0;
          bValue = Array.isArray(b.attachments) ? b.attachments.length : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return sorted;
  }, [comments, sortColumn, sortDirection]);

  const attachmentGalleryItems = useMemo(() => {
    if (!Array.isArray(comments)) return [];
    return comments.flatMap((row) => {
      const attachments = Array.isArray(row.attachments) ? row.attachments : [];
      return attachments
        .map((attachment) => {
          if (!attachment) return null;
          if (typeof attachment === 'string') {
            return { url: null, name: attachment, id: `${row.id}-${attachment}` };
          }
          const url = attachment.url || null;
          const name = attachment.name || attachment.file_name || attachment.url || 'Adjunto';
          return { url, name, id: `${row.id}-${url || name}` };
        })
        .filter(Boolean);
    });
  }, [comments]);

  const formatDate = (date) => {
    if (!date) {
      return '-';
    }
    const parsed = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(parsed.getTime())) {
      return '-';
    }
    const options = {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    };
    return parsed.toLocaleString('en-US', options).replace(',', '');
  };

  const renderSortIcon = (column) => {
    if (sortColumn !== column) {
      return <ArrowDownwardIcon className={styles.sortIconInactive} />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUpwardIcon className={styles.sortIconActive} />
    ) : (
      <ArrowDownwardIcon className={styles.sortIconActive} />
    );
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>Comments</span>
      </div>

      <TableContainer className={styles.tableContainer}>
        <Table size="small">
          <TableHead>
            <TableRow className={styles.headerRow}>
              <TableCell className={styles.headerCell}>
                <div
                  className={styles.headerCellContent}
                  onClick={() => handleSort('name')}
                >
                  <span>Name</span>
                  {renderSortIcon('name')}
                </div>
              </TableCell>
              <TableCell className={styles.headerCell}>
                <div
                  className={styles.headerCellContent}
                  onClick={() => handleSort('time')}
                >
                  <span>Time</span>
                  {renderSortIcon('time')}
                </div>
              </TableCell>
              <TableCell className={styles.headerCell}>
                <div
                  className={styles.headerCellContent}
                  onClick={() => handleSort('comment')}
                >
                  <span>Comment</span>
                  {renderSortIcon('comment')}
                </div>
              </TableCell>
              <TableCell className={styles.headerCell}>
                <div
                  className={styles.headerCellContent}
                  onClick={() => handleSort('attachments')}
                >
                  <span>Attachments</span>
                  {renderSortIcon('attachments')}
                </div>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow className={styles.bodyRow}>
                <TableCell className={styles.emptyCell} colSpan={4}>
                  Cargando comentarios...
                </TableCell>
              </TableRow>
            ) : sortedComments.length === 0 ? (
              <TableRow className={styles.bodyRow}>
                <TableCell className={styles.emptyCell} colSpan={4}>
                  No hay comentarios
                </TableCell>
              </TableRow>
            ) : (
              sortedComments.map((row) => {
                const attachments = Array.isArray(row.attachments) ? row.attachments : [];
                return (
                  <TableRow key={row.id} className={styles.bodyRow}>
                    <TableCell className={styles.cell}>{row.name || '-'}</TableCell>
                    <TableCell className={styles.cell}>{formatDate(row.time)}</TableCell>
                    <TableCell className={styles.cell}>{row.comment || '-'}</TableCell>
                    <TableCell className={styles.cell}>
                      {attachments.length > 0 ? (
                        <div className={styles.attachments}>
                          {attachments.map((attachment, index) => {
                            const label =
                              typeof attachment === 'string'
                                ? attachment
                                : attachment?.name || attachment?.file_name || attachment?.url || 'Adjunto';
                            return (
                              <span key={`${row.id}-attachment-${index}`} className={styles.attachment}>
                                {label}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {attachmentGalleryItems.length > 0 ? (
        <div className={styles.attachmentsSection}>
          <div className={styles.attachmentsTitle}>Attachments</div>
          <div className={styles.attachmentsGrid}>
            {attachmentGalleryItems.map((item) => (
              <div key={item.id} className={styles.attachmentCard}>
                <div className={styles.attachmentCardTitle}>{item.name}</div>
                {item.url ? (
                  <img className={styles.attachmentImage} src={item.url} alt={item.name} />
                ) : (
                  <div className={styles.attachmentPlaceholder}>{item.name}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default Comments;

